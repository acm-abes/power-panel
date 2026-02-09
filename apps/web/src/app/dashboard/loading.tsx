/** @format */

import {
  PageHeaderSkeleton,
  AnalyticsSkeleton,
} from "@/components/loading-skeletons";
import { Page, PageContent } from "@/components/page";

export default function Loading() {
  return (
    <Page>
      <PageContent>
        <PageHeaderSkeleton />
        <AnalyticsSkeleton />
      </PageContent>
    </Page>
  );
}
