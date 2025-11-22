import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomQuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}

export function CustomQuestionInput({
  value,
  onChange,
  onAdd,
}: CustomQuestionInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onAdd();
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle>Add Custom Question</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your own interview question..."
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={onAdd}>Add</Button>
        </div>
      </CardContent>
    </Card>
  );
}
