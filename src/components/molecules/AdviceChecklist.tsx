import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdviceChecklistProps = {
  title: string;
  description: string;
  items: string[];
};

export function AdviceChecklist({ title, description, items }: AdviceChecklistProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item) => (
            <li className="flex gap-3 text-sm leading-6" key={item}>
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-normal" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
