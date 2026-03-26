using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using PtuneSync.GoogleTasks;
using PtuneSync.Infrastructure;
using PtuneSync.Models;
using PtuneSync.OAuth;
using PtuneSync.Protocol;

namespace PtuneSync.Services;

public sealed class DiffCommandService
{
    public async Task<DiffCommandResult> ExecuteAsync(RunRequestFile request, CancellationToken cancellationToken = default)
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

        var localTasks = await ReadLocalTasksAsync(taskJsonFile, cancellationToken);
        var listName = ResolveListName(request, localTasks);

        AppConfigManager.RememberVaultHome(request.Home);
        var tokenWorkDir = TokenWorkDirResolver.Resolve(request.Home, "DiffCommandService");
        var oauthManager = new OAuthManager(AppConfigManager.Config.GoogleOAuth, tokenWorkDir);
        var api = new GoogleTasksAPI(oauthManager);
        var importer = new TasksImporter(api);
        var remoteTasks = await importer.FetchTasksAsync(listName);

        return TaskDiffAnalyzer.Analyze(localTasks, remoteTasks);
    }

    private static async Task<List<MyTask>> ReadLocalTasksAsync(string taskJsonFile, CancellationToken cancellationToken)
    {
        var raw = await File.ReadAllTextAsync(taskJsonFile, cancellationToken);
        using var document = JsonDocument.Parse(raw);

        if (!document.RootElement.TryGetProperty("tasks", out var tasksElement) || tasksElement.ValueKind != JsonValueKind.Array)
        {
            throw new InvalidOperationException("task_json_file must contain a tasks array.");
        }

        var tasks = JsonSerializer.Deserialize<List<MyTask>>(tasksElement.GetRawText(), new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        });

        return tasks ?? new List<MyTask>();
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

public sealed record DiffCommandResult(
    DiffSummary Summary,
    IReadOnlyList<string> Errors,
    IReadOnlyList<string> Warnings);

public sealed record DiffSummary(
    int Create,
    int Update,
    int Delete,
    int Errors,
    int Warnings);
