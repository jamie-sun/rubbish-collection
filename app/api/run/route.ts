import { main } from "@/lib/check-reminders";
import { NextResponse } from "next/server";

const TEST_ADDRESS = JSON.stringify([
  {
    label: "Test address",
    addressId: "12342276885",
    ntfyTopic: "jsdev-collection-bins-test",
  },
]);

export async function POST() {
  const logs: string[] = [];
  console.log = (...args: any[]) => {
    logs.push(args.join(" "));
  };

  try {
    await main(TEST_ADDRESS);
    return NextResponse.json({ output: logs.join("\n"), exitCode: 0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logs.push(message);
    return NextResponse.json({ output: logs.join("\n"), exitCode: 1 });
  }
}
