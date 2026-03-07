import { cookies } from 'next/headers';

export default async function TestCookiesPage() {
    const cookieStore = await cookies();
    console.log("TEST_COOKIES: cookieStore is", cookieStore);
    console.log("TEST_COOKIES: type of get:", typeof cookieStore.get);
    return <div>{typeof cookieStore.get}</div>;
}
