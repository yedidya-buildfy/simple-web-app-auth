import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - List user's credit cards
export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get credit cards
    const { data: cards, error } = await supabase
      .from("credit_cards")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching credit cards:", error);
      return NextResponse.json(
        { error: "Failed to fetch credit cards" },
        { status: 500 }
      );
    }

    // Transform to match CreditCard type
    const transformedCards = cards.map((card) => ({
      id: card.id,
      userId: card.user_id,
      name: card.name,
      lastFour: card.last_four,
      cardType: card.card_type,
      bankPatterns: card.bank_patterns || [],
      typicalPaymentDay: card.typical_payment_day,
      isActive: card.is_active,
    }));

    return NextResponse.json({ cards: transformedCards });
  } catch (error) {
    console.error("Credit cards GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new credit card
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, lastFour, cardType, bankPatterns, typicalPaymentDay } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Card name is required" },
        { status: 400 }
      );
    }

    // Insert credit card
    const { data: card, error } = await supabase
      .from("credit_cards")
      .insert({
        user_id: user.id,
        name: name.trim(),
        last_four: lastFour || null,
        card_type: cardType || null,
        bank_patterns: bankPatterns || [],
        typical_payment_day: typicalPaymentDay || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating credit card:", error);
      return NextResponse.json(
        { error: "Failed to create credit card" },
        { status: 500 }
      );
    }

    // Transform to match CreditCard type
    const transformedCard = {
      id: card.id,
      userId: card.user_id,
      name: card.name,
      lastFour: card.last_four,
      cardType: card.card_type,
      bankPatterns: card.bank_patterns || [],
      typicalPaymentDay: card.typical_payment_day,
      isActive: card.is_active,
    };

    return NextResponse.json({ card: transformedCard }, { status: 201 });
  } catch (error) {
    console.error("Credit cards POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
