/** @format */

import {
  PageHeaderSkeleton,
  FormSkeleton,
} from "@/components/loading-skeletons";
import { Page, PageContent } from "@/components/page";

export default function Loading() {
  return (
    <Page>
      <PageContent>
        <PageHeaderSkeleton />
        <FormSkeleton />
      </PageContent>
    </Page>
  );
}
