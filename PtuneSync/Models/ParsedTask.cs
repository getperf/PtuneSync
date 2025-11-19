namespace PtuneSync.Models;

public class ParsedTask
{
    public int Index { get; set; }
    public string Title { get; set; } = "";
    public int Pomodoro { get; set; }
    public int? ParentIndex { get; set; }
    public string RawLine { get; set; } = "";
}
