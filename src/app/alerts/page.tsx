import { OfficialAlertsFeed } from "@/components/organisms/OfficialAlertsFeed";
import { PublicPageLayout } from "@/components/templates/PublicPageLayout";
import { getOfficialAlerts } from "@/server/services/alert-service";

export default async function AlertsPage() {
  const officialAlerts = await getOfficialAlerts();

  return (
    <PublicPageLayout title="ประกาศเตือน" description="ประกาศจริงจากกรมอุตุนิยมวิทยา อ่านฉบับเต็มก่อนตัดสินใจเดินทางหรือเตรียมตัว">
      <OfficialAlertsFeed alerts={officialAlerts.alerts} sourceStatus={officialAlerts.sourceStatus} updatedAt={officialAlerts.updatedAt} />
    </PublicPageLayout>
  );
}
