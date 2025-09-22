import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import Link from "next/link";
import { FileText, Folder, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DocItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: DocItem[];
}

async function getDocsStructure(): Promise<DocItem[]> {
  const docsPath = join(process.cwd(), "docs");

  async function scanDirectory(
    dirPath: string,
    relativePath: string = ""
  ): Promise<DocItem[]> {
    const items = await readdir(dirPath);
    const result: DocItem[] = [];

    for (const item of items) {
      const fullPath = join(dirPath, item);
      const itemStat = await stat(fullPath);
      const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;

      if (itemStat.isDirectory()) {
        const children = await scanDirectory(fullPath, itemRelativePath);
        result.push({
          name: item,
          path: itemRelativePath,
          isDirectory: true,
          children: children.length > 0 ? children : undefined,
        });
      } else if (item.endsWith(".md")) {
        result.push({
          name: item.replace(".md", ""),
          path: itemRelativePath.replace(".md", ""),
          isDirectory: false,
        });
      }
    }

    // Sort: directories first, then files alphabetically
    const sorted = result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    // Move 'development' directory to the end at the top level
    if (!relativePath) {
      const devIndex = sorted.findIndex(
        (i) => i.isDirectory && i.name.toLowerCase() === "development"
      );
      if (devIndex >= 0) {
        const [dev] = sorted.splice(devIndex, 1);
        sorted.push(dev);
      }
    }

    return sorted;
  }

  return scanDirectory(docsPath);
}

function DocItemComponent({
  item,
  level = 0,
}: {
  item: DocItem;
  level?: number;
}) {
  const indent = level * 16;

  if (item.isDirectory) {
    return (
      <div className="mb-1">
        <div
          className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          <Folder className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          <span className="font-medium text-foreground group-hover:text-primary transition-colors text-sm break-words leading-relaxed">
            {item.name
              .replace(/-/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>
        </div>
        {item.children && (
          <div className="ml-1">
            {item.children.map((child) => (
              <DocItemComponent
                key={child.path}
                item={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={`/docs/${item.path}`}
      className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group"
      style={{ paddingLeft: `${indent + 8}px` }}
    >
      <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      <span className="text-foreground group-hover:text-primary transition-colors text-sm break-words leading-relaxed">
        {item.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    </Link>
  );
}

export default async function DocsPage() {
  const docs = await getDocsStructure();
  // Try loading docs/README.md to show MD content on splash
  let rootReadme: { content: string; title: string } | null = null;
  try {
    const filePath = join(process.cwd(), "docs", "README.md");
    const content = await readFile(filePath, "utf-8");
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : "Overview";
    rootReadme = { content, title };
  } catch {}

  return (
    <div className="h-full bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Ledger Entry Docs</h1>
            <p className="text-muted-foreground">
              A natural-language interface for double-entry accounting with
              GitHub-backed storage.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Mobile Navigation Sheet */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="mb-4">
                    <Menu className="h-4 w-4 mr-2" />
                    Documentation Menu
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Documentation</SheetTitle>
                  </SheetHeader>
                  <nav className="space-y-1 mt-6">
                    {docs.map((item) => (
                      <DocItemComponent key={item.path} item={item} />
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Sidebar Navigation */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-8 bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-6 text-foreground border-b border-border pb-3">
                  Documentation
                </h2>
                <nav className="space-y-1">
                  {docs.map((item) => (
                    <DocItemComponent key={item.path} item={item} />
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9">
              <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {rootReadme ? (
                    <>
                      <h2 className="text-3xl font-bold mb-6">
                        {rootReadme.title}
                      </h2>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: rootReadme.content
                            .replace(/^#\s+.+$/m, "")
                            .replace(
                              /^##\s+(.+)$/gm,
                              '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>'
                            )
                            .replace(
                              /^###\s+(.+)$/gm,
                              '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>'
                            )
                            .replace(
                              /^####\s+(.+)$/gm,
                              '<h4 class="text-lg font-semibold mt-4 mb-2">$1</h4>'
                            )
                            .replace(
                              /^\*\s+(.+)$/gm,
                              '<li class="ml-4">$1</li>'
                            )
                            .replace(
                              /^\-\s+(.+)$/gm,
                              '<li class="ml-4">$1</li>'
                            )
                            .replace(
                              /^\d+\.\s+(.+)$/gm,
                              '<li class="ml-4">$1</li>'
                            )
                            .replace(
                              /`([^`]+)`/g,
                              '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
                            )
                            .replace(
                              /```(\w+)?\n([\s\S]*?)```/g,
                              '<pre class="bg-muted p-4 rounded-lg overflow-x-auto"><code>$2</code></pre>'
                            )
                            .replace(
                              /\[([^\]]+)\]\(([^)]+)\)/g,
                              '<a href="$2" class="text-primary hover:underline">$1</a>'
                            )
                            .replace(/\n\n/g, '</p><p class="mb-4">')
                            .replace(
                              /^(?!<[h|l|p|d|a|s])/gm,
                              '<p class="mb-4">'
                            )
                            .replace(
                              /(<li[^>]*>.*<\/li>)/g,
                              '<ul class="list-disc list-inside mb-4">$1</ul>'
                            ),
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <h2>What is Ledger Entry?</h2>
                      <p>
                        Ledger Entry helps you record personal or business
                        finances using plain language. It converts your words
                        into balanced double-entry transactions and stores them
                        as standard Ledger journal files in your own GitHub
                        repository.
                      </p>

                      <h2>Why use it?</h2>
                      <ul>
                        <li>
                          <strong>Fast capture:</strong> Type what happened; we
                          generate the entry.
                        </li>
                        <li>
                          <strong>Own your data:</strong> Journals live in your
                          GitHub repo, versioned and portable.
                        </li>
                        <li>
                          <strong>Compatible:</strong> Works with the Ledger CLI
                          and existing journal workflows.
                        </li>
                      </ul>

                      <h2>How it works</h2>
                      <ol>
                        <li>
                          Connect a GitHub repo that contains your journals,
                          rules, and accounts.
                        </li>
                        <li>
                          Enter a command like{" "}
                          <code>add coffee 10 @ Starbucks with visa</code>.
                        </li>
                        <li>
                          Rules map items, merchants, and payments to the right
                          accounts and currency.
                        </li>
                        <li>
                          Review, tweak if needed, then save to the current
                          month’s journal.
                        </li>
                      </ol>

                      <h2>Example</h2>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <code>
                          add coffee 10 @ Starbucks with visa memo &quot;morning
                          pick-me-up&quot;
                        </code>
                      </pre>
                      <p className="text-sm text-muted-foreground">
                        The app parses this and prepares a balanced entry based
                        on your rules.
                      </p>

                      <h2>What you’ll need</h2>
                      <ul>
                        <li>
                          A GitHub account and repository (we can help you
                          create one).
                        </li>
                        <li>
                          Basic accounts and optional rules for
                          items/merchants/payments.
                        </li>
                      </ul>

                      <h2>Quick start</h2>
                      <ul>
                        <li>
                          <Link
                            href="/docs/user/getting-started/introduction"
                            className="text-primary hover:underline"
                          >
                            Introduction
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/docs/user/getting-started/create-repository"
                            className="text-primary hover:underline"
                          >
                            Create your repository
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/docs/user/configuration/overview"
                            className="text-primary hover:underline"
                          >
                            Configure GitHub access
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/docs/user/commands/overview"
                            className="text-primary hover:underline"
                          >
                            Learn the command system
                          </Link>
                        </li>
                      </ul>

                      <p className="text-muted-foreground">
                        Looking for developer docs? See the{" "}
                        <Link
                          href="/docs/development/README"
                          className="text-primary hover:underline"
                        >
                          development
                        </Link>{" "}
                        section.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
