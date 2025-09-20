import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Folder, Menu } from "lucide-react";
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

    return result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return scanDirectory(docsPath);
}

function DocItemComponent({
  item,
  level = 0,
  currentPath,
}: {
  item: DocItem;
  level?: number;
  currentPath: string;
}) {
  const indent = level * 16;
  const isActive = item.path === currentPath;

  if (item.isDirectory) {
    return (
      <div className="mb-1">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-md transition-colors cursor-pointer group ${
            isActive
              ? "bg-primary/10 border border-primary/20"
              : "hover:bg-muted/50"
          }`}
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          <Folder
            className={`w-4 h-4 transition-colors flex-shrink-0 ${
              isActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-primary"
            }`}
          />
          <span
            className={`font-medium transition-colors text-sm break-words leading-relaxed ${
              isActive
                ? "text-primary"
                : "text-foreground group-hover:text-primary"
            }`}
          >
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
                currentPath={currentPath}
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
      className={`flex items-center gap-2 py-2 px-3 rounded-md transition-colors group ${
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50"
      }`}
      style={{ paddingLeft: `${indent + 8}px` }}
    >
      <FileText
        className={`w-4 h-4 transition-colors flex-shrink-0 ${
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-primary"
        }`}
      />
      <span
        className={`transition-colors text-sm break-words leading-relaxed ${
          isActive
            ? "text-primary font-medium"
            : "text-foreground group-hover:text-primary"
        }`}
      >
        {item.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    </Link>
  );
}

async function getDocContent(
  slug: string[]
): Promise<{ content: string; title: string } | null> {
  try {
    const filePath = join(process.cwd(), "docs", ...slug) + ".md";
    const content = await readFile(filePath, "utf-8");

    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch
      ? titleMatch[1]
      : slug[slug.length - 1].replace(/-/g, " ");

    return { content, title };
  } catch {
    return null;
  }
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const docs = await getDocsStructure();
  const docContent = await getDocContent(slug);

  if (!docContent) {
    notFound();
  }

  const currentPath = slug.join("/");

  return (
    <div className="h-full bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors bg-card border border-border rounded-lg px-4 py-2 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Documentation
            </Link>
          </nav>

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
                      <DocItemComponent
                        key={item.path}
                        item={item}
                        currentPath={currentPath}
                      />
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Sidebar Navigation */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="sticky top-8 bg-card border border-border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-6 text-foreground border-b border-border pb-3">
                  Contents
                </h2>
                <nav className="space-y-1">
                  {docs.map((item) => (
                    <DocItemComponent
                      key={item.path}
                      item={item}
                      currentPath={currentPath}
                    />
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9">
              <article className="bg-card border border-border rounded-lg p-8 shadow-sm">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h1 className="text-3xl font-bold mb-6">
                    {docContent.title}
                  </h1>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: docContent.content
                        .replace(/^#\s+.+$/m, "") // Remove the title since we display it separately
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
                        .replace(/^\*\s+(.+)$/gm, '<li class="ml-4">$1</li>')
                        .replace(/^-\s+(.+)$/gm, '<li class="ml-4">$1</li>')
                        .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>')
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
                        .replace(/^(?!<[h|l|p|d|a|s])/gm, '<p class="mb-4">')
                        .replace(
                          /(<li[^>]*>.*<\/li>)/g,
                          '<ul class="list-disc list-inside mb-4">$1</ul>'
                        ),
                    }}
                  />
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
