import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import { Button } from "./ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  warningText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  warningText,
  onConfirm,
  onCancel,
  isLoading
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-[400px] border-border bg-card/65 backdrop-blur-md shadow-2xl animate-in zoom-in-95 duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        {warningText && (
          <CardContent>
            <div className="p-3 bg-red-950/20 border border-red-500/20 text-xs text-red-400 rounded-md">
              {warningText}
            </div>
          </CardContent>
        )}
        <CardFooter className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Executing..." : "Confirm"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
