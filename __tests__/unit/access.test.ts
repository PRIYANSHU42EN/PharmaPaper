import { getUserAccess } from "@/lib/access";

describe("getUserAccess() — Free Notes Platform Model", () => {
  test("returns level:none and canComment:false for unauthenticated visitor (null)", async () => {
    const result = await getUserAccess(null);
    expect(result.level).toBe("none");
    expect(result.canReadPDFs).toBe(true);
    expect(result.canComment).toBe(false);
    expect(result.isTrial).toBe(false);
  });

  test("returns level:none and canComment:false for undefined userId", async () => {
    const result = await getUserAccess(undefined);
    expect(result.level).toBe("none");
    expect(result.canComment).toBe(false);
  });

  test("returns level:free with full reading and comment rights for logged-in user", async () => {
    const result = await getUserAccess("student_user_123");
    expect(result.level).toBe("free");
    expect(result.canReadPDFs).toBe(true);
    expect(result.canComment).toBe(true);
    expect(result.isTrial).toBe(false);
  });
});
