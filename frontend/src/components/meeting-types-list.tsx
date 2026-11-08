import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MeetingType } from "@/lib/api";

export function MeetingTypesList({ meetingTypes }: { meetingTypes: MeetingType[] }) {
  if (meetingTypes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
        Типов встреч пока нет
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {meetingTypes.map((meetingType) => (
        <li key={meetingType.id}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{meetingType.name}</CardTitle>
                <Badge variant="secondary" className="shrink-0">
                  {meetingType.durationMinutes} мин
                </Badge>
              </div>
            </CardHeader>
            {meetingType.description !== "" && (
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {meetingType.description}
                </p>
              </CardContent>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
