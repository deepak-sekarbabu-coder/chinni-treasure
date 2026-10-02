import Link from "next/link";
import AdminRouteState from "@/src/components/admin/AdminRouteState";

export default function AdminNotFound() {
  return (
    <AdminRouteState
      heading="Page Not Found"
      code="404"
      title="Not Found"
      body={"The admin page you're looking for doesn't exist."}
      actions={
        <>
          <Link href="/admin" className="btn btn-primary">
            Back to Dashboard
          </Link>
          <Link href="/" className="btn btn-secondary">
            Return Home
          </Link>
        </>
      }
    />
  );
}
