import { readdir, stat } from "fs/promises";
import { join } from "path";
import Link from "next/link";
import { FileText, Folder, FolderOpen, Menu } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Documentation</h1>
            <p className="text-muted-foreground">
              Browse all project documentation organized by topic and category.
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
                  <h2>Welcome to the Documentation</h2>
                  <p>
                    This documentation is automatically generated from the{" "}
                    <code>docs/</code> folder in the project. Documents are
                    organized by folders and can be easily navigated using the
                    sidebar.
                  </p>

                  <h3>Getting Started</h3>
                  <p>
                    Start with the{" "}
                    <Link
                      href="/docs/README"
                      className="text-primary hover:underline"
                    >
                      main README
                    </Link>
                    for an overview of the project and available documentation.
                  </p>

                  <h3>Key Documents</h3>
                  <ul>
                    <li>
                      <Link
                        href="/docs/SPEC_FOR_LEDGER_APP"
                        className="text-primary hover:underline"
                      >
                        High-level Specification
                      </Link>{" "}
                      - Project overview and requirements
                    </li>
                    <li>
                      <Link
                        href="/docs/KEYBOARD_SHORTCUTS"
                        className="text-primary hover:underline"
                      >
                        Keyboard Shortcuts
                      </Link>{" "}
                      - All available keyboard shortcuts
                    </li>
                    <li>
                      <Link
                        href="/docs/AUTH_SETUP"
                        className="text-primary hover:underline"
                      >
                        Authentication Setup
                      </Link>{" "}
                      - How to configure authentication
                    </li>
                  </ul>

                  <h3>Organization</h3>
                  <p>
                    Documents are automatically organized by folders. You can
                    create new folders in the <code>docs/</code> directory to
                    group related documentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
