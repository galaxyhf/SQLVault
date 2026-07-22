import { Badge } from "@/components/ui/badge";
import type { CommandTag } from "@/db/schema";
import { tagLabel } from "@/lib/utils";

const tagVariants: Record<CommandTag, "default" | "secondary" | "outline"> = {
  conferencia: "default",
  conversao: "secondary",
  geral: "outline",
};

export function CommandTags({ tags }: { tags: CommandTag[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant={tagVariants[tag]}>
          {tagLabel(tag)}
        </Badge>
      ))}
    </div>
  );
}
