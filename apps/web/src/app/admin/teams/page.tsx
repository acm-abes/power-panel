/** @format */

import { getPendingTeams } from "@/actions/get-pending-teams";
import { Page, PageHeading, PageContent } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { TeamsFilterClient } from "@/components/teams-filter-client";

export default async function PendingTeamsPage() {
  const teams = await getPendingTeams();

  return (
    <Page>
      <PageHeading
        title="Pending Teams"
        badge={<Badge variant="outline">{teams.length} teams</Badge>}
      />
      <PageContent>
        <TeamsFilterClient teams={teams} />
      </PageContent>
    </Page>
  );
}
