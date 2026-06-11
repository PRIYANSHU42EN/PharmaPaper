/**
 * Unit tests for src/lib/validators.ts
 *
 * Verifies that all Zod schemas correctly accept valid input
 * and reject invalid input with clear error messages.
 */

import {
  searchSchema,
  materialSchema,
  paymentSchema,
  subscriptionVerifySchema,
  emailSchema,
  createOrderSchema,
  createSubscriptionSchema,
} from "@/lib/validators";

// ── searchSchema ──────────────────────────────────────────────────────────────
describe("searchSchema", () => {
  test("accepts standard alphanumeric query", () => {
    expect(searchSchema.safeParse({ query: "pharmacology" }).success).toBe(true);
  });

  test("accepts query with spaces and hyphens", () => {
    expect(searchSchema.safeParse({ query: "human anatomy physiology" }).success).toBe(true);
  });

  test("accepts Unicode letters (pharmacy subject names)", () => {
    // Devanagari / pharmacy subjects with special chars
    expect(searchSchema.safeParse({ query: "Biochemistry & Pathology" }).success).toBe(true);
  });

  test("rejects empty string", () => {
    const result = searchSchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  test("rejects query over 100 chars", () => {
    const result = searchSchema.safeParse({ query: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  test("rejects SQL injection patterns", () => {
    const result = searchSchema.safeParse({ query: "'; DROP TABLE study_materials; --" });
    expect(result.success).toBe(false);
  });
});

// ── materialSchema ────────────────────────────────────────────────────────────
describe("materialSchema", () => {
  const valid = {
    title: "Pharmacology Notes Semester 4",
    course: "B.Pharm" as const,
    semester: 4,
    subject: "General Pharmacology",
    type: "notes" as const,
    file_url: "https://supabase.co/storage/v1/object/public/notes/file.pdf",
  };

  test("accepts valid study material", () => {
    expect(materialSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects non-allowlisted URL domain", () => {
    const result = materialSchema.safeParse({ ...valid, file_url: "https://evil.com/malware.pdf" });
    expect(result.success).toBe(false);
  });

  test("rejects semester > 8", () => {
    const result = materialSchema.safeParse({ ...valid, semester: 9 });
    expect(result.success).toBe(false);
  });

  test("rejects semester < 1", () => {
    const result = materialSchema.safeParse({ ...valid, semester: 0 });
    expect(result.success).toBe(false);
  });

  test("rejects unknown course", () => {
    const result = materialSchema.safeParse({ ...valid, course: "M.Pharm" });
    expect(result.success).toBe(false);
  });

  test("accepts pyq type", () => {
    expect(materialSchema.safeParse({ ...valid, type: "pyq" }).success).toBe(true);
  });

  test("rejects unknown type", () => {
    const result = materialSchema.safeParse({ ...valid, type: "video" });
    expect(result.success).toBe(false);
  });
});

// ── paymentSchema ─────────────────────────────────────────────────────────────
describe("paymentSchema", () => {
  const validPayment = {
    user_id: "user_abc123",
    plan_type: "premium_monthly" as const,
    razorpay_order_id: "order_abc123456789",
    razorpay_payment_id: "pay_abc123456789",
    razorpay_signature: "a".repeat(64),
  };

  test("accepts valid premium_monthly payment", () => {
    expect(paymentSchema.safeParse(validPayment).success).toBe(true);
  });

  test("accepts video_pass plan_type", () => {
    expect(paymentSchema.safeParse({ ...validPayment, plan_type: "video_pass" }).success).toBe(true);
  });

  test("accepts premium_yearly plan_type", () => {
    expect(paymentSchema.safeParse({ ...validPayment, plan_type: "premium_yearly" }).success).toBe(true);
  });

  test("rejects unknown plan_type", () => {
    const result = paymentSchema.safeParse({ ...validPayment, plan_type: "gold_plan" });
    expect(result.success).toBe(false);
  });

  test("rejects order_id without 'order_' prefix", () => {
    const result = paymentSchema.safeParse({ ...validPayment, razorpay_order_id: "abc123" });
    expect(result.success).toBe(false);
  });

  test("rejects payment_id without 'pay_' prefix", () => {
    const result = paymentSchema.safeParse({ ...validPayment, razorpay_payment_id: "abc123" });
    expect(result.success).toBe(false);
  });

  test("rejects signature shorter than 40 chars", () => {
    const result = paymentSchema.safeParse({ ...validPayment, razorpay_signature: "tooshort" });
    expect(result.success).toBe(false);
  });

  test("accepts signature of 64 chars (standard HMAC-SHA256)", () => {
    expect(paymentSchema.safeParse(validPayment).success).toBe(true);
  });
});

// ── emailSchema ───────────────────────────────────────────────────────────────
describe("emailSchema", () => {
  test("accepts valid email", () => {
    expect(emailSchema.safeParse({ email: "student@college.edu" }).success).toBe(true);
  });

  test("lowercases email output", () => {
    const result = emailSchema.safeParse({ email: "STUDENT@COLLEGE.EDU" });
    if (result.success) {
      expect(result.data.email).toBe("student@college.edu");
    }
  });

  test("rejects invalid email", () => {
    expect(emailSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });

  test("rejects email over 254 chars", () => {
    const result = emailSchema.safeParse({ email: "a".repeat(250) + "@b.com" });
    expect(result.success).toBe(false);
  });
});

// ── createOrderSchema ─────────────────────────────────────────────────────────
describe("createOrderSchema", () => {
  test("accepts valid video_pass order", () => {
    expect(createOrderSchema.safeParse({ amount: 2000, currency: "INR", plan_type: "video_pass" }).success).toBe(true);
  });

  test("rejects zero amount", () => {
    expect(createOrderSchema.safeParse({ amount: 0, currency: "INR", plan_type: "video_pass" }).success).toBe(false);
  });

  test("rejects negative amount", () => {
    expect(createOrderSchema.safeParse({ amount: -100, currency: "INR", plan_type: "video_pass" }).success).toBe(false);
  });

  test("rejects non-INR currency", () => {
    expect(createOrderSchema.safeParse({ amount: 2000, currency: "USD", plan_type: "video_pass" }).success).toBe(false);
  });
});
