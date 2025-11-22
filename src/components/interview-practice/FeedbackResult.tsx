import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Markdown from "react-markdown";

interface FeedbackResultProps {
  feedback: string;
}

export function FeedbackResult({ feedback }: FeedbackResultProps) {
  if (!feedback) return null;

  return (
    <Card className="border-2 border-primary">
      <CardHeader className="pb-2">
        <CardTitle>AI Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <Markdown>{feedback}</Markdown>
        </div>
      </CardContent>
    </Card>
  );
}
