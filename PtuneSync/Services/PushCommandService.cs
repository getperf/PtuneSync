using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using PtuneSync.GoogleTasks;
using PtuneSync.Infrastructure;
using PtuneSync.Infrastructure.Sqlite;
using PtuneSync.Models;
using PtuneSync.OAuth;
using PtuneSync.Protocol;

namespace PtuneSync.Services;

public sealed class PushCommandService
{
    private readonly DatabaseRuntimeFactory _databaseRuntimeFactory;
    private readonly TasksRepository _tasksRepository;
    private readonly SyncHistoriesRepository _syncHistoriesRepository;

    public PushCommandService()
        : this(new DatabaseRuntimeFactory(), new TasksRepository(), new SyncHistoriesRepository())
    {
    }

    public PushCommandService(
        DatabaseRuntimeFactory databaseRuntimeFactory,
        TasksRepository tasksRepository,
        SyncHistoriesRepository syncHistoriesRepository)
    {
        _databaseRuntimeFactory = databaseRuntimeFactory;
        _tasksRepository = tasksRepository;
        _syncHistoriesRepository = syncHistoriesRepository;
    }

    public async Task<PushCommandResult> ExecuteAsync(RunRequestFile request, CancellationToken cancellationToken = default)
    {
        var taskJsonFile = request.Input?.TaskJsonFile;
        if (string.IsNullOrWhiteSpace(taskJsonFile))
        {
            throw new InvalidOperationException("task_json_file is required.");
        }

        if (!File.Exists(taskJsonFile))
        {
            throw new FileNotFoundException("task_json_file was not found.", taskJsonFile);
        }

        var taskDocument = await TaskJsonDocumentReader.ReadAsync(taskJsonFile, cancellationToken);
        if (taskDocument.Tasks.Count == 0)
        {
            throw new InvalidOperationException("task_json_file must contain a tasks array.");
        }

        var localTasks = TaskJsonDocumentReader.ToMyTasks(taskDocument.Tasks);
        var localTaskByOriginalId = localTasks
            .Where(static task => !string.IsNullOrWhiteSpace(task.Id))
            .ToDictionary(static task => task.Id, StringComparer.Ordinal);
        var listName = ResolveListName(request, localTasks);
        var allowDelete = request.Args?.AllowDelete ?? false;
        var startedAt = DateTimeOffset.UtcNow.ToString("O");
        var syncId = Guid.NewGuid().ToString();

        AppConfigManager.RememberVaultHome(request.Home);
        var tokenWorkDir = TokenWorkDirResolver.Resolve(request.Home, "PushCommandService");
        var oauthManager = new OAuthManager(AppConfigManager.Config.GoogleOAuth, tokenWorkDir);
        var api = new GoogleTasksAPI(oauthManager);
        var taskList = await api.EnsureTaskListAsync(listName);
        var listId = taskList.Id ?? throw new InvalidOperationException("Task list id was not resolved.");

        var runtime = await _databaseRuntimeFactory.CreateForVaultAsync(request.Home, cancellationToken);
        await MarkRunningAsync(runtime, syncId, listName, startedAt, cancellationToken);

        try
        {
            var remoteTasks = await api.ListTasksAsync(listId);
            var plan = TaskDiffAnalyzer.BuildPlan(localTasks, remoteTasks);

            if (plan.Errors.Count > 0)
            {
                throw new InvalidOperationException(string.Join(Environment.NewLine, plan.Errors));
            }

            await ApplyCreatesAsync(api, listId, taskDocument.Tasks, localTaskByOriginalId, plan.ToCreate);
            await ApplyUpdatesAsync(api, listId, plan.ToUpdate);

            if (allowDelete)
            {
                await ApplyDeletesAsync(api, listId, plan.ToDelete);
            }

            ResolveParentKeys(taskDocument.Tasks, localTaskByOriginalId);
            var reorderedRemoteTasks = TaskTreeOrderService.Rebuild(await api.ListTasksAsync(listId));
            var reorderService = new TaskReorderService(api);
            await reorderService.ReorderAsync(listId, localTasks, reorderedRemoteTasks);

            var completedAt = DateTimeOffset.UtcNow.ToString("O");
            var pushedTasks = await api.ListTasksAsync(listId);
            var syncRecord = new PullSyncRecord(
                plan.ToCreate.Count + plan.ToUpdate.Count + (allowDelete ? plan.ToDelete.Count : 0),
                plan.ToCreate.Count,
                plan.ToUpdate.Count,
                allowDelete ? plan.ToDelete.Count : 0);

            await CompleteAsync(runtime, syncId, listName, completedAt, pushedTasks, syncRecord, cancellationToken);

            return new PushCommandResult(
                listName,
                allowDelete,
                plan.ToCommandResult(),
                syncRecord);
        }
        catch (Exception ex)
        {
            await FailAsync(runtime, syncId, ex.Message, cancellationToken);
            throw;
        }
    }

    private async Task MarkRunningAsync(
        DatabaseRuntime runtime,
        string syncId,
        string listName,
        string startedAt,
        CancellationToken cancellationToken)
    {
        await using var connection = await runtime.OpenConnectionAsync(cancellationToken);
        await using var baseTransaction = await connection.BeginTransactionAsync(cancellationToken);
        var transaction = (Microsoft.Data.Sqlite.SqliteTransaction)baseTransaction;

        await _syncHistoriesRepository.CreateAsync(
            connection,
            transaction,
            syncId,
            command: "push",
            status: "running",
            listName,
            dailyNoteKey: null,
            startedAt,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }

    private async Task CompleteAsync(
        DatabaseRuntime runtime,
        string syncId,
        string listName,
        string completedAt,
        IReadOnlyCollection<MyTask> pushedTasks,
        PullSyncRecord syncRecord,
        CancellationToken cancellationToken)
    {
        await using var connection = await runtime.OpenConnectionAsync(cancellationToken);
        await using var baseTransaction = await connection.BeginTransactionAsync(cancellationToken);
        var transaction = (Microsoft.Data.Sqlite.SqliteTransaction)baseTransaction;

        await _tasksRepository.ReplaceCurrentTasksFromPushAsync(
            connection,
            transaction,
            listName,
            pushedTasks,
            completedAt,
            cancellationToken);

        await _syncHistoriesRepository.CompleteAsync(
            connection,
            transaction,
            syncId,
            status: "success",
            completedAt,
            syncRecord,
            cancellationToken: cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }

    private async Task FailAsync(
        DatabaseRuntime runtime,
        string syncId,
        string note,
        CancellationToken cancellationToken)
    {
        await using var connection = await runtime.OpenConnectionAsync(cancellationToken);
        await using var baseTransaction = await connection.BeginTransactionAsync(cancellationToken);
        var transaction = (Microsoft.Data.Sqlite.SqliteTransaction)baseTransaction;

        await _syncHistoriesRepository.FailAsync(
            connection,
            transaction,
            syncId,
            DateTimeOffset.UtcNow.ToString("O"),
            note,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);
    }

    private static async Task ApplyCreatesAsync(
        GoogleTasksAPI api,
        string listId,
        IReadOnlyList<TaskJsonTask> inputTasks,
        IDictionary<string, MyTask> localTaskByOriginalId,
        IReadOnlyList<MyTask> toCreate)
    {
        var inputById = inputTasks
            .Where(static task => !string.IsNullOrWhiteSpace(task.Id))
            .ToDictionary(static task => task.Id!, StringComparer.Ordinal);

        foreach (var task in toCreate)
        {
            if (string.IsNullOrWhiteSpace(task.Id) || !inputById.TryGetValue(task.Id, out var inputTask))
            {
                await api.AddTaskAsync(task, listId);
                continue;
            }

            var originalId = task.Id;
            var createTask = CloneForCreate(task, inputTask, localTaskByOriginalId);
            var created = await api.AddTaskAsync(createTask, listId);
            task.Id = created.Id;

            if (!string.IsNullOrWhiteSpace(originalId) && localTaskByOriginalId.ContainsKey(originalId))
            {
                localTaskByOriginalId[originalId] = task;
            }
        }
    }

    private static async Task ApplyUpdatesAsync(GoogleTasksAPI api, string listId, IReadOnlyList<MyTask> toUpdate)
    {
        foreach (var task in toUpdate)
        {
            await api.UpdateTaskAsync(task, listId);
        }
    }

    private static async Task ApplyDeletesAsync(GoogleTasksAPI api, string listId, IReadOnlyList<MyTask> toDelete)
    {
        foreach (var task in toDelete)
        {
            if (!string.IsNullOrWhiteSpace(task.Id))
            {
                await api.DeleteTaskAsync(task.Id, listId);
            }
        }
    }

    private static void ResolveParentKeys(
        IReadOnlyList<TaskJsonTask> inputTasks,
        IReadOnlyDictionary<string, MyTask> localTaskByOriginalId)
    {
        foreach (var inputTask in inputTasks)
        {
            if (string.IsNullOrWhiteSpace(inputTask.Id))
            {
                continue;
            }

            if (!localTaskByOriginalId.TryGetValue(inputTask.Id, out var localTask))
            {
                continue;
            }

            var parentKey = inputTask.EffectiveParentKey();

            if (!string.IsNullOrWhiteSpace(parentKey)
                && localTaskByOriginalId.TryGetValue(parentKey, out var parentTask)
                && !string.IsNullOrWhiteSpace(parentTask.Id))
            {
                localTask.Parent = parentTask.Id;
            }
            else if (!string.IsNullOrWhiteSpace(localTask.Parent)
                && localTaskByOriginalId.ContainsKey(localTask.Parent))
            {
                localTask.Parent = null;
            }
            else if (string.IsNullOrWhiteSpace(parentKey))
            {
                localTask.Parent = null;
            }
        }
    }

    private static MyTask CloneForCreate(
        MyTask source,
        TaskJsonTask inputTask,
        IDictionary<string, MyTask> localTaskByOriginalId)
    {
        var clone = new MyTask(string.Empty, source.Title, source.Pomodoro, source.Status)
        {
            Due = source.Due,
            Started = source.Started,
            Completed = source.Completed,
            Note = source.Note,
            ReviewFlags = source.ReviewFlags,
        };

        var parentKey = inputTask.EffectiveParentKey();

        if (!string.IsNullOrWhiteSpace(parentKey)
            && localTaskByOriginalId.TryGetValue(parentKey, out var parentTask)
            && parentTask is not null
            && !string.IsNullOrWhiteSpace(parentTask.Id))
        {
            clone.Parent = parentTask.Id;
        }
        else if (!string.IsNullOrWhiteSpace(source.Parent)
            && !localTaskByOriginalId.ContainsKey(source.Parent))
        {
            clone.Parent = source.Parent;
        }

        return clone;
    }

    private static string ResolveListName(RunRequestFile request, IReadOnlyList<MyTask> localTasks)
    {
        if (!string.IsNullOrWhiteSpace(request.Args?.List))
        {
            return request.Args.List;
        }

        var taskListId = localTasks
            .Select(static task => task.TaskListId)
            .FirstOrDefault(static value => !string.IsNullOrWhiteSpace(value));

        return string.IsNullOrWhiteSpace(taskListId)
            ? GoogleTasksAPI.DefaultTodayListName
            : taskListId;
    }
}

public sealed record PushCommandResult(
    string ListName,
    bool AllowDelete,
    DiffCommandResult DiffResult,
    PullSyncRecord SyncRecord);
