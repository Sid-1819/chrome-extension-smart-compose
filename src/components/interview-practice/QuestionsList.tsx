import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuestionsListProps {
  questions: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function QuestionsList({
  questions,
  currentIndex,
  onSelect,
}: QuestionsListProps) {
  if (questions.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Generated Interview Questions ({questions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant={currentIndex === index ? "default" : "outline"}
              className={cn(
                "w-full justify-start text-left h-auto py-3 whitespace-normal",
                currentIndex === index && "bg-primary text-primary-foreground"
              )}
              onClick={() => onSelect(index)}
            >
              <span className="font-medium mr-2">Q{index + 1}:</span>
              <span className="truncate">{question}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
