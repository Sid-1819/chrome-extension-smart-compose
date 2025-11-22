import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Markdown from "react-markdown";

interface QuestionsDisplayProps {
  questions: string;
}

export function QuestionsDisplay({ questions }: QuestionsDisplayProps) {
  if (!questions) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-left">Generated Interview Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-left text-muted-foreground">
          <Markdown>{questions}</Markdown>
        </div>
      </CardContent>
    </Card>
  );
}
