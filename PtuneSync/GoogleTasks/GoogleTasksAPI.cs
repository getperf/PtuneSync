using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;
using System.Net.Http;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using PtuneSync.Infrastructure;
using PtuneSync.Models;
using PtuneSync.OAuth;
using System.Text;

namespace PtuneSync.GoogleTasks;

public class GoogleTasksAPI
{
    private readonly OAuthManager _oauthManager;

    public const string DefaultTodayListName = "Today";

    public GoogleTasksAPI(OAuthManager oauthManager)
    {
        _oauthManager = oauthManager;
    }

    /// <summary>
    /// 指定されたタイトルのタスクリストを存在確認し、なければ作成して返す
    /// </summary>
    public async Task<MyTaskList> EnsureTaskListAsync(string title)
    {
        AppLog.Debug("[GoogleTasksAPI] EnsureTaskListAsync start - title={0}", title);

        // [1] タスクリスト一覧を取得
        var lists = await ListTaskListsAsync();
        AppLog.Debug("[GoogleTasksAPI] Retrieved {0} task lists", lists.Count);

        // [2] タイトル一致を検索
        var existing = lists.FirstOrDefault(l => l.Title == title);
        if (existing != null)
        {
            AppLog.Info("[GoogleTasksAPI] Existing list found: {0} ({1})", existing.Title, existing.Id);
            AppLog.Debug("[GoogleTasksAPI] EnsureTaskListAsync end - reuse existing");
            return existing;
        }

        // [3] 該当なし → 作成
        AppLog.Info("[GoogleTasksAPI] '{0}' list not found, creating new one", title);
        var created = await CreateTaskListAsync(title);

        AppLog.Info("[GoogleTasksAPI] Created list: {0} ({1})", created.Title, created.Id);
        AppLog.Debug("[GoogleTasksAPI] EnsureTaskListAsync end - created new");
        return created;
    }

    /// <summary>
    /// タスクリスト一覧を取得し、MyTaskListモデルとして返す
    /// </summary>
    public async Task<List<MyTaskList>> ListTaskListsAsync()
    {
        AppLog.Debug("[GoogleTasksAPI] ListTaskListsAsync start");

        // [1] アクセストークン取得
        var token = await _oauthManager.GetOrRefreshAsync();
        if (token == null || string.IsNullOrEmpty(token.AccessToken))
        {
            AppLog.Warn("[GoogleTasksAPI] Access token could not be retrieved");
            throw new InvalidOperationException("Access token could not be retrieved.");
        }

        AppLog.Debug("[GoogleTasksAPI] AccessToken prefix={0}",
            token.AccessToken.Substring(0, Math.Min(8, token.AccessToken.Length)));

        // [2] APIクライアント初期化
        var api = new GoogleTasksApiClient(token.AccessToken);
        const string url = "https://tasks.googleapis.com/tasks/v1/users/@me/lists";
        AppLog.Debug("[GoogleTasksAPI] Requesting task lists from: {0}", url);

        // [3] API実行
        var result = await api.RequestAsync<ApiListResponse<MyTaskList>>(url, HttpMethod.Get);

        // [4] 結果検証
        if (result?.Items == null)
        {
            AppLog.Warn("[GoogleTasksAPI] No task lists found in response");
            return new List<MyTaskList>();
        }

        AppLog.Info("[GoogleTasksAPI] Retrieved {0} task lists", result.Items.Count);

        foreach (var item in result.Items)
        {
            AppLog.Debug("[GoogleTasksAPI] - {0}: {1}", item.Title, item.Id);
        }

        AppLog.Debug("[GoogleTasksAPI] ListTaskListsAsync end");
        return result.Items;
    }

    /// <summary>
    /// タスクリストを新規作成
    /// </summary>
    public async Task<MyTaskList> CreateTaskListAsync(string title)
    {
        AppLog.Debug("[GoogleTasksAPI] CreateTaskListAsync start - title={0}", title);

        // [1] トークン取得
        var token = await _oauthManager.GetOrRefreshAsync();
        if (token == null || string.IsNullOrEmpty(token.AccessToken))
        {
            AppLog.Warn("[GoogleTasksAPI] Access token missing, cannot create task list");
            throw new InvalidOperationException("Access token missing.");
        }

        // [2] API呼び出し
        var api = new GoogleTasksApiClient(token.AccessToken);
        const string url = "https://tasks.googleapis.com/tasks/v1/users/@me/lists";

        AppLog.Debug("[GoogleTasksAPI] Sending POST to {0} with title={1}", url, title);

        var result = await api.RequestAsync<MyTaskList>(
            url,
            HttpMethod.Post,
            new { title }
        );

        if (result == null)
        {
            AppLog.Warn("[GoogleTasksAPI] Failed to create task list - title={0}", title);
            throw new InvalidOperationException($"Failed to create task list: {title}");
        }

        AppLog.Info("[GoogleTasksAPI] Created new list: {0} ({1})", result.Title, result.Id);
        AppLog.Debug("[GoogleTasksAPI] CreateTaskListAsync end");
        return result;
    }

    // ---------- Tasks (CRUD) ----------
    public async Task<List<MyTask>> ListTasksAsync(string taskListId)
    {
        AppLog.Debug("[GoogleTasksAPI] ListTasksAsync listId={0}", taskListId);
        var token = await _oauthManager.GetOrRefreshAsync();
        var api = new GoogleTasksApiClient(token.AccessToken);

        var result = new List<MyTask>();
        string? nextPageToken = null;

        do
        {
            var url = $"https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks?showCompleted=true&showHidden=true";
            if (!string.IsNullOrEmpty(nextPageToken))
                url += $"&pageToken={Uri.EscapeDataString(nextPageToken)}";

            AppLog.Debug("[GoogleTasksAPI] GET {0}", url);
            var res = await api.RequestAsync<TasksResponse>(url, HttpMethod.Get);
            var items = res?.Items ?? new List<JsonElement>();

            foreach (var je in items)
            {
                var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                AddStr("id"); AddStr("title"); AddStr("notes"); AddStr("status");
                AddStr("due"); AddStr("completed"); AddStr("updated");
                AddStr("parent"); AddStr("position");
                if (je.TryGetProperty("deleted", out var del) &&
                    del.ValueKind is JsonValueKind.True or JsonValueKind.False)
                    dict["deleted"] = del.GetBoolean();

                var model = MyTaskFactory.FromApiData(dict!, taskListId);
                result.Add(model);

                void AddStr(string name)
                {
                    if (je.TryGetProperty(name, out var v) && v.ValueKind != JsonValueKind.Null)
                        dict[name] = v.ToString();
                }
            }

            nextPageToken = res?.NextPageToken;
            AppLog.Debug("[GoogleTasksAPI] Page done. nextPageToken={0}", nextPageToken ?? "<none>");

        } while (!string.IsNullOrEmpty(nextPageToken));

        AppLog.Info("[GoogleTasksAPI] ListTasks total count={0}", result.Count);
        return result;
    }

    public async Task<MyTask> AddTaskAsync(MyTask task, string taskListId)
    {
        AppLog.Debug("[GoogleTasksAPI] AddTaskAsync listId={0} title={1}", taskListId, task.Title);
        var token = await _oauthManager.GetOrRefreshAsync();
        var api = new GoogleTasksApiClient(token.AccessToken);

        var body = BuildTaskBody(task);
        AppLog.Debug("[GoogleTasksAPI] POST body.len={0}", BodyLen(body));

        var url = $"https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks";
        var created = await api.RequestAsync<JsonElement>(url, HttpMethod.Post, body);
        var id = created.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
        if (!string.IsNullOrEmpty(id)) task.Id = id;

        AppLog.Info("[GoogleTasksAPI] Added task id={0}", task.Id);
        return task;
    }

    public async Task UpdateTaskAsync(MyTask task, string taskListId)
    {
        AppLog.Debug("[GoogleTasksAPI] UpdateTaskAsync listId={0} id={1}", taskListId, task.Id);
        var token = await _oauthManager.GetOrRefreshAsync();
        var api = new GoogleTasksApiClient(token.AccessToken);

        var body = BuildTaskBody(task);
        var url = $"https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks/{task.Id}";
        await api.RequestAsync<object?>(url, HttpMethod.Put, body);
        AppLog.Info("[GoogleTasksAPI] Updated task id={0}", task.Id);
    }

    public async Task DeleteTaskAsync(string taskId, string taskListId)
    {
        AppLog.Debug("[GoogleTasksAPI] DeleteTaskAsync listId={0} id={1}", taskListId, taskId);
        var token = await _oauthManager.GetOrRefreshAsync();
        var api = new GoogleTasksApiClient(token.AccessToken);

        var url = $"https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks/{taskId}";
        await api.RequestAsync<object?>(url, HttpMethod.Delete);
        AppLog.Info("[GoogleTasksAPI] Deleted task id={0}", taskId);
    }

    public async Task MoveTaskAsync(string taskId, string taskListId, string? parentId = null, string? previousId = null)
    {
        AppLog.Debug("[GoogleTasksAPI] MoveTaskAsync listId={0} id={1} parent={2} previous={3}",
            taskListId, taskId, parentId ?? "<none>", previousId ?? "<none>");

        var token = await _oauthManager.GetOrRefreshAsync();
        var api = new GoogleTasksApiClient(token.AccessToken);

        var url = new StringBuilder($"https://tasks.googleapis.com/tasks/v1/lists/{taskListId}/tasks/{taskId}/move");
        var sep = '?';
        if (!string.IsNullOrEmpty(parentId)) { url.Append($"{sep}parent={Uri.EscapeDataString(parentId)}"); sep = '&'; }
        if (!string.IsNullOrEmpty(previousId)) { url.Append($"{sep}previous={Uri.EscapeDataString(previousId)}"); }

        await api.RequestAsync<object?>(url.ToString(), HttpMethod.Post);
        AppLog.Info("[GoogleTasksAPI] Moved task id={0}", taskId);
    }

    // ---------- helpers ----------

    private static object BuildTaskBody(MyTask task)
    {
        var notesParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(task.Note)) notesParts.Add(task.Note);
        if (task.Pomodoro != null && task.Pomodoro.Planned > 0)
        {
            var s = $"🍅x{task.Pomodoro.Planned}";
            if (task.Pomodoro.Actual.HasValue) s += $" ✅x{task.Pomodoro.Actual}";
            notesParts.Add(s);
        }
        var body = new Dictionary<string, object?>
        {
            ["title"] = task.Title,
            ["notes"] = string.Join(' ', notesParts).Trim(),
            ["status"] = string.IsNullOrEmpty(task.Status) ? "needsAction" : task.Status
        };
        if (!string.IsNullOrEmpty(task.Parent)) body["parent"] = task.Parent;
        if (!string.IsNullOrEmpty(task.Due)) body["due"] = task.Due;
        return body;
    }

    private static int BodyLen(object body) => Encoding.UTF8.GetByteCount(JsonSerializer.Serialize(body));

    private class ApiListResponse<T>
    {
        [JsonPropertyName("items")] public List<T>? Items { get; set; }
    }

    private class TasksResponse
    {
        [JsonPropertyName("items")] public List<JsonElement>? Items { get; set; }
        [JsonPropertyName("nextPageToken")] public string? NextPageToken { get; set; }
    }

}
