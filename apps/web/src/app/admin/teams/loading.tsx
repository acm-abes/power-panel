/** @format */

import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/loading-skeletons";
import { Page, PageContent } from "@/components/page";

export default function Loading() {
  return (
    <Page>
      <PageContent>
        <PageHeaderSkeleton />
        <TableSkeleton />
      </PageContent>
    </Page>
  );
}
