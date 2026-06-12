import { Badge } from "../Atoms/badge";
import type { ActiveGridsTableProps } from "../../Interfaces/components";

export function ActiveGridsTable({ grids = [] }: ActiveGridsTableProps) {
  return (
    <div className="overflow-x-auto border border-border/40 rounded-lg bg-card/20">
      <table className="w-full text-xs text-left border-collapse font-mono">
        <thead>
          <tr className="border-b border-border/40 text-muted-foreground bg-muted/10">
            <th className="py-2.5 px-4 font-medium">SYMBOL</th>
            <th className="py-2.5 px-4 font-medium">DIRECTION</th>
            <th className="py-2.5 px-4 font-medium text-right">ENTRY_PRICE</th>
            <th className="py-2.5 px-4 font-medium text-right">LEVERAGE</th>
            <th className="py-2.5 px-4 font-medium text-right">MARGIN_ALLOCATED</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {grids.map((grid, idx) => (
            <tr key={idx} className="hover:bg-muted/10 transition-colors">
              <td className="py-2.5 px-4 font-bold text-foreground">{grid.symbol}</td>
              <td className="py-2.5 px-4">
                <Badge 
                  variant="outline" 
                  className={grid.direction.toUpperCase() === "LONG" 
                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
                    : "text-red-400 border-red-500/20 bg-red-500/5"}
                >
                  {grid.direction.toUpperCase()}
                </Badge>
              </td>
              <td className="py-2.5 px-4 text-right">${grid.entryPrice.toFixed(2)}</td>
              <td className="py-2.5 px-4 text-right">{grid.leverage}x</td>
              <td className="py-2.5 px-4 text-right">${grid.margin.toFixed(2)}</td>
            </tr>
          ))}
          {grids.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                No active grids found on current bot status.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
