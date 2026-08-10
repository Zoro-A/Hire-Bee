import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataTableShell } from "@/features/admin/components/DataTableShell.jsx"

const columns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
]
const rows = [
  { id: 1, name: "Ada Lovelace", email: "ada@example.com" },
  { id: 2, name: "Grace Hopper", email: "grace@example.com" },
]

function setup() {
  return render(
    <DataTableShell
      caption="Platform users"
      columns={columns}
      rows={rows}
      getRowKey={(r) => r.id}
      renderCell={(r, k) => r[k]}
      searchKeys={["name", "email"]}
      emptyLabel="No users found."
    />,
  )
}

describe("DataTableShell", () => {
  it("renders an accessible table with a caption and all rows", () => {
    setup()
    expect(screen.getByRole("table", { name: /platform users/i })).toBeInTheDocument()
    expect(screen.getAllByRole("row")).toHaveLength(3) // header + 2
  })

  it("filters rows by the search box across searchKeys", async () => {
    setup()
    await userEvent.type(screen.getByRole("searchbox", { name: /search/i }), "grace")
    expect(screen.getAllByRole("row")).toHaveLength(2) // header + 1
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument()
  })

  it("shows the empty label when nothing matches", async () => {
    setup()
    await userEvent.type(screen.getByRole("searchbox", { name: /search/i }), "zzzz")
    expect(screen.getByText("No users found.")).toBeInTheDocument()
  })
})
