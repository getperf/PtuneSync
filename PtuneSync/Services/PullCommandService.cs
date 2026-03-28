using System;
using System.Collections.Generic;
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

public sealed class PullCommandService
{
    private readonly DatabaseRuntimeFactory _databaseRuntimeFactory;
    private readonly TasksRepository _tasksRepository;
    private readonly SyncHistoriesRepository _syncHistoriesRepository;

    public PullCommandService()
        : this(new DatabaseRuntimeFactory(), new TasksRepository(), new SyncHistoriesRepository())
    {
    }

    public PullCommandService(
        DatabaseRuntimeFactory databaseRuntimeFactory,
        TasksRepository tasksRepository,
        SyncHistoriesRepository syncHistoriesRepository)
    {
        _databaseRuntimeFactory = databaseRuntimeFactory;
        _tasksRepository = tasksRepository;
        _syncHistoriesRepository = syncHistoriesRepository;
    }

    public async Task<PullCommandResult> ExecuteAsync(RunRequestFile request, CancellationToken cancellationToken = default)
    {
        var listName = string.IsNullOrWhiteSpace(request.Args?.List)
            ? GoogleTasksAPI.DefaultTodayListName
            : request.Args.List;
        var includeCompleted = request.Args?.IncludeCompleted ?? false;
        var exportedAt = DateTimeOffset.UtcNow.ToString("O");

        AppConfigManager.RememberVaultHome(request.Home);
        var tokenWorkDir = TokenWorkDirResolver.Resolve(request.Home, "PullCommandService");
        var oauthManager = new OAuthManager(AppConfigManager.Config.GoogleOAuth, tokenWorkDir);
        var api = new GoogleTasksAPI(oauthManager);
        var importer = new TasksImporter(api);
        var fetchedTasks = TaskTreeOrderService.Rebuild(await importer.FetchTasksAsync(listName));

        var runtime = await _databaseRuntimeFactory.CreateForVaultAsync(request.Home, cancellationToken);
        var syncId = Guid.NewGuid().ToString();
        PullSyncRecord syncRecord;

        await using (var connection = await runtime.OpenConnectionAsync(cancellationToken))
        {
            await using var baseTransaction = await connection.BeginTransactionAsync(cancellationToken);
            var transaction = (Microsoft.Data.Sqlite.SqliteTransaction)baseTransaction;

            await _syncHistoriesRepository.CreateAsync(
                connection,
                transaction,
                syncId,
                command: "pull",
                status: "running",
                listName,
                dailyNoteKey: null,
                startedAt: exportedAt,
                cancellationToken);

            syncRecord = await _tasksRepository.UpsertPulledTasksAsync(
                connection,
                transaction,
                listName,
                fetchedTasks,
                exportedAt,
                cancellationToken);

            await _syncHistoriesRepository.CompleteAsync(
                connection,
                transaction,
                syncId,
                status: "success",
                completedAt: exportedAt,
                syncRecord,
                cancellationToken: cancellationToken);

            await transaction.CommitAsync(cancellationToken);
        }

        var responseTasks = includeCompleted
            ? fetchedTasks
            : fetchedTasks.Where(static task => !string.Equals(task.Status, "completed", StringComparison.OrdinalIgnoreCase)).ToList();

        var payload = new
        {
            schema_version = 2,
            list = listName,
            include_completed = includeCompleted,
            exported_at = exportedAt,
            tasks = responseTasks,
        };

        var runDir = request.ResolveRunDir();
        var requestIdentity = request.ResolveRequestIdentity();
        string? backupFile = null;
        if (includeCompleted)
        {
            backupFile = await PullResultFileService.WriteBackupAsync(runDir, new
            {
                type = "pull-backup",
                command = "pull",
                request_nonce = request.ResolveRequestNonce(),
                request_id = requestIdentity,
                payload.schema_version,
                payload.list,
                payload.include_completed,
                payload.exported_at,
                payload.tasks,
            });
        }

        return new PullCommandResult(
            listName,
            includeCompleted,
            exportedAt,
            fetchedTasks.Count,
            responseTasks,
            backupFile,
            syncRecord);
    }
}

public sealed record PullCommandResult(
    string ListName,
    bool IncludeCompleted,
    string ExportedAt,
    int TotalFetchedCount,
    IReadOnlyCollection<MyTask> ResponseTasks,
    string? BackupFile,
    PullSyncRecord SyncRecord);
