import { BMC_BLOCKS, type BmcSection } from "@/lib/schemas";

interface BmcGridProps {
  sections: BmcSection[];
  workspaceId: string;
}

export default function BmcGrid({ sections, workspaceId }: BmcGridProps) {
  const sectionsMap = new Map(sections.map((s) => [s.block, s.content]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 auto-rows-[220px] gap-4 text-white">
      {BMC_BLOCKS.map((block) => {
        const content = sectionsMap.get(block.key as any) || "No strategic framework logged yet. Click to edit.";
        
        let gridStyle = "border border-zinc-800 bg-zinc-900/20 p-5 rounded-xl flex flex-col justify-between overflow-y-auto ";
        if (block.key === "key_partners") gridStyle += "md:col-span-1 md:row-span-2";
        else if (block.key === "key_activities" || block.key === "key_resources") gridStyle += "md:col-span-1 md:row-span-1";
        else if (block.key === "value_propositions") gridStyle += "md:col-span-1 md:row-span-2";
        else if (block.key === "customer_relationships" || block.key === "channels") gridStyle += "md:col-span-1 md:row-span-1";
        else if (block.key === "customer_segments") gridStyle += "md:col-span-1 md:row-span-2";
        else if (block.key === "cost_structure" || block.key === "revenue_streams") gridStyle += "md:col-span-2 md:row-span-1";

        return (
          <div key={block.key} className={gridStyle}>
            <div>
              <h4 className="text-xs font-mono tracking-wider uppercase text-cyan-400 font-semibold">{block.label}</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">{block.description}</p>
              <div className="text-xs text-zinc-300 mt-3 whitespace-pre-wrap leading-relaxed font-sans">
                {content}
              </div>
            </div>
            <div className="text-[9px] text-zinc-600 text-right font-mono mt-2 select-none">[COO Editable]</div>
          </div>
        );
      })}
    </div>
  );
}