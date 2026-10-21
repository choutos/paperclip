import { mkdtemp, mkdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { capturePaperclipWorkspace, diffPaperclipWorkspace } from "./workspace-diff.js";

describe("runner-verified workspace diffs", () => {
  it("rejects an aborted snapshot before scanning", async () => {
    await expect(capturePaperclipWorkspace("/unused", { signal: AbortSignal.abort() }))
      .rejects.toMatchObject({ name: "AbortError" });
  });

  it("captures create, modify, delete, and rename without runner-owned noise", async () => {
    const root = await mkdtemp(join(tmpdir(), "paperclip-workspace-diff-"));
    await mkdir(join(root, ".paperclip-runner-prp"));
    await writeFile(join(root, ".paperclip-runner-prp", "state.json"), "before");
    await writeFile(join(root, "modify.txt"), "old\n");
    await writeFile(join(root, "delete.txt"), "gone\n");
    await writeFile(join(root, "rename.txt"), "same\n");
    const before = await capturePaperclipWorkspace(root);

    await writeFile(join(root, ".paperclip-runner-prp", "state.json"), "after");
    await writeFile(join(root, "modify.txt"), "new\n");
    await writeFile(join(root, "create.txt"), "created\n");
    await writeFile(join(root, "delete.txt"), "");
    await rename(join(root, "rename.txt"), join(root, "renamed.txt"));
    const after = await capturePaperclipWorkspace(root);
    const diff = diffPaperclipWorkspace(before, after, "turn-1:workspace");

    expect(diff?.schema).toBe("paperclip.workspace.diff.v1");
    expect(diff?.source).toBe("runner_verified");
    expect(diff?.files.map((file) => [file.path, file.operation])).toEqual([
      ["create.txt", "create"],
      ["delete.txt", "modify"],
      ["modify.txt", "modify"],
      ["renamed.txt", "rename"],
    ]);
    expect(diff?.files.find((file) => file.path === "renamed.txt")?.previousPath).toBe("rename.txt");
    expect(JSON.stringify(diff)).not.toContain(".paperclip-runner-prp");
  });

  it("returns no record when the workspace did not change", async () => {
    const root = await mkdtemp(join(tmpdir(), "paperclip-workspace-stable-"));
    await writeFile(join(root, "stable.txt"), "same\n");
    const before = await capturePaperclipWorkspace(root);
    const after = await capturePaperclipWorkspace(root);
    expect(diffPaperclipWorkspace(before, after, "turn-1:workspace")).toBeNull();
  });

  it("retains normalized relative paths through nested directories", async () => {
    const root = await mkdtemp(join(tmpdir(), "paperclip-workspace-paths-"));
    try {
      await mkdir(join(root, "nested", "deep"), { recursive: true });
      await writeFile(join(root, "nested", "deep", "éclair.txt"), "nested\n");
      const snapshot = await capturePaperclipWorkspace(root);
      expect([...snapshot.keys()]).toEqual(["nested/deep/éclair.txt"]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("preserves file order, byte caps, and oversized-file handling with read-ahead", async () => {
    const root = await mkdtemp(join(tmpdir(), "paperclip-workspace-read-ahead-"));
    try {
      await writeFile(join(root, "file-00.bin"), Buffer.alloc(2 * 1024 * 1024 + 1));
      const content = Buffer.alloc(1024 * 1024, 65);
      for (let file = 1; file <= 33; file += 1) {
        await writeFile(join(root, `file-${String(file).padStart(2, "0")}.txt`), content);
      }
      await symlink(join(root, "file-01.txt"), join(root, "file-00-link.txt"));

      const snapshot = await capturePaperclipWorkspace(root);
      expect([...snapshot.keys()]).toEqual([
        "file-00.bin",
        ...Array.from({ length: 32 }, (_, index) => `file-${String(index + 1).padStart(2, "0")}.txt`),
      ]);
      expect(snapshot.get("file-00.bin")?.content).toBeNull();
      expect(snapshot.get("file-00.bin")?.binary).toBe(true);
      expect([...snapshot.values()].reduce((sum, file) => sum + (file.content?.length ?? 0), 0)).toBe(32 * 1024 * 1024);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
