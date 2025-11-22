import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CurrentQuestionProps {
  question: string;
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function CurrentQuestion({
  question,
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
}: CurrentQuestionProps) {
  if (currentIndex < 0) return null;

  return (
    <Card className="mb-4 border-2 border-primary">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">
            Question {currentIndex + 1} of {totalQuestions}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={currentIndex === totalQuestions - 1}
            >
              Next
            </Button>
          </div>
        </div>
        <p className="text-foreground text-lg">{question}</p>
      </CardContent>
    </Card>
  );
}
