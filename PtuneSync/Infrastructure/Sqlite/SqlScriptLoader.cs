using System;
using System.IO;
using System.Linq;
using System.Reflection;

namespace PtuneSync.Infrastructure.Sqlite;

public sealed class SqlScriptLoader
{
    private readonly Assembly _assembly;

    public SqlScriptLoader()
    {
        _assembly = typeof(SqlScriptLoader).Assembly;
    }

    public string LoadSchema()
    {
        return LoadText("PtuneSync.Infrastructure.Sqlite.SqlScripts.schema.sql");
    }

    public string LoadMigration(int nextVersion)
    {
        return LoadText($"PtuneSync.Infrastructure.Sqlite.SqlScripts.Migrations.v{nextVersion}.sql");
    }

    private string LoadText(string resourceName)
    {
        AppLog.Debug("[SqlScriptLoader] Loading SQL resource: {ResourceName}", resourceName);
        using var stream = _assembly.GetManifestResourceStream(resourceName);
        if (stream == null)
        {
            var known = string.Join(", ", _assembly.GetManifestResourceNames().OrderBy(static x => x));
            throw new InvalidOperationException($"SQL resource not found: {resourceName}. Known resources: {known}");
        }

        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
