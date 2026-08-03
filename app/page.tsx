import { getChatGPTUser } from "./chatgpt-auth";
import LunchApp from "./LunchApp";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "etctaichi@gmail.com";

export default async function Home() {
  const user = await getChatGPTUser();
  const isAdmin = user ? user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() : false;

  return <LunchApp initialUser={user} initialIsAdmin={isAdmin} adminEmail={ADMIN_EMAIL} />;
}
