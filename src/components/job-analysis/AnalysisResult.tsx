import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Markdown from "react-markdown";

interface AnalysisResultProps {
  result: string;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  if (!result) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-left">Job Description Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-left text-muted-foreground">
          <Markdown>{result}</Markdown>
        </div>
      </CardContent>
    </Card>
  );
}
