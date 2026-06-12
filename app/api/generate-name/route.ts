import { NextRequest, NextResponse } from "next/server";
import { maleNames, femaleNames } from "@/data/character-data";

export async function POST(req: NextRequest) {
  const { gender } = await req.json();
  const names = gender === "woman" ? femaleNames : maleNames;
  const name = names[Math.floor(Math.random() * names.length)];
  return NextResponse.json({ name });
}
