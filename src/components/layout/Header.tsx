import { Card, CardContent } from "@/components/ui/card";

export function Header() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-foreground mb-2">
        InterviewCoach AI
      </h1>
      <p className="text-muted-foreground">
        AI-Powered Interview Prep • On-Device • No API Key Needed
      </p>
      <Card className="mt-3">
        <CardContent className="p-3">
          <p className="text-sm text-muted-foreground">
            <strong>Pro Tip:</strong> Highlight job descriptions on any webpage,
            right-click → <strong>"InterviewCoach AI"</strong> → then click the
            extension icon to see results!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
