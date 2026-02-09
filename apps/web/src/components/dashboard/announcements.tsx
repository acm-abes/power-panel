/** @format */

import { prisma } from "@power/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function DashboardAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      creator: true,
    },
  });

  if (announcements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="border-l-2 pl-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{announcement.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {announcement.content}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                By {announcement.creator.name}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
