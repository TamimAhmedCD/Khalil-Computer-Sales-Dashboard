import { CategoryManager } from "@/components/Admin/Expenses/CategoryManager";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/expenses">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Expenses
          </Button>
        </Link>
      </div>
      <CategoryManager />
    </div>
  );
}
