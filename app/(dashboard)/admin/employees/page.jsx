"use client";
import React, { useState } from "react";
import {
  Users,
  UserCheck,
  Trophy,
  DollarSign,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Layers,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

// Mock Data
const initialEmployees = [
  {
    id: 1,
    name: "Anika Rahman",
    phone: "+880 1711-223344",
    role: "Sales Executive",
    joinDate: "2024-01-15",
    totalSales: 45000,
    commissionEarned: 4500,
    status: true,
    description:
      "Top performer for Q1. Excellent communication skills and great team player.",
  },
  {
    id: 2,
    name: "Tanvir Ahmed",
    phone: "+880 1812-556677",
    role: "Manager",
    joinDate: "2023-05-10",
    totalSales: 82000,
    commissionEarned: 8200,
    status: true,
    description:
      "Manages the core retail sales team. Deep understanding of CRM tools.",
  },
];

export default function EmployeesPage() {
  const fetchEmployees = async () => {
    const res = await axios.get("/api/admin/employees");
    return res.data?.data || [];
  };

  const {
    data: employee,
    status,
    error,
  } = useQuery({
    queryKey: ["employee"],
    queryFn: fetchEmployees,
  });
  console.log(employee);
  const [employees, setEmployees] = useState(initialEmployees);

  // Modals Open/Close States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected Employee & Form States
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "Sales Executive",
    joinDate: "",
    totalSales: 0,
    commissionEarned: 0,
    status: true,
    description: "",
  });

  // Calculate Metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status).length;
  const totalCommission = employees.reduce(
    (acc, curr) => acc + curr.commissionEarned,
    0,
  );
  const topPerformer =
    employees.length > 0
      ? [...employees].sort((a, b) => b.totalSales - a.totalSales)[0].name
      : "N/A";

  // CRUD Handlers
  const handleOpenView = (emp) => {
    setSelectedEmployee(emp);
    setIsViewOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedEmployee(null);
    setFormData({
      name: "",
      phone: "",
      role: "Sales Executive",
      joinDate: new Date().toISOString().split("T")[0],
      totalSales: 0,
      commissionEarned: 0,
      status: true,
      description: "",
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormData({ ...emp });
    setIsAddEditOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedEmployee) {
      setEmployees(
        employees.map((emp) =>
          emp.id === selectedEmployee.id ? { ...formData, id: emp.id } : emp,
        ),
      );
    } else {
      setEmployees([...employees, { ...formData, id: Date.now() }]);
    }
    setIsAddEditOpen(false);
  };

  const handleDeleteConfirm = () => {
    setEmployees(employees.filter((emp) => emp.id !== selectedEmployee.id));
    setIsDeleteOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* --- TOP HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members, roles, sales track and commissions.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="rounded-xl h-11 px-5 shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-muted/30 border-border/50 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Employees
              </p>
              <p className="text-2xl font-black">{totalEmployees}</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border/50 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Active Staff
              </p>
              <p className="text-2xl font-black text-green-600">
                {activeEmployees}
              </p>
            </div>
            <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border/50 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Top Performer
              </p>
              <p className="text-xl font-bold truncate max-w-37.5">
                {topPerformer}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-border/50 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Commission
              </p>
              <p className="text-2xl font-black text-indigo-600">
                <span className="font-black">৳</span>
                {totalCommission.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- EMPLOYEE TABLE --- */}
      <div className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="text-xs text-muted-foreground uppercase tracking-wider font-semibold hover:bg-transparent">
              <TableHead className="h-12">Employee Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Total Sales</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {employees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="p-8 text-center text-muted-foreground"
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow
                  key={emp.id}
                  className="hover:bg-muted/10 transition-colors"
                >
                  <TableCell className="font-bold text-foreground">
                    {emp.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {emp.phone}
                  </TableCell>
                  <TableCell className="font-medium">{emp.role}</TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className="font-black text-md">৳</span>
                    {emp.totalSales.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-black text-green-600">
                    <span className="font-black text-md">৳</span>
                    {emp.commissionEarned.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        emp.status
                          ? "bg-green-500/10 text-green-600"
                          : "bg-zinc-500/10 text-zinc-500"
                      }`}
                    >
                      {emp.status ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenView(emp)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-500/5"
                        onClick={() => handleOpenEdit(emp)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-500/5"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ======================================================== */}
      {/* 1. VIEW DETAILS DIALOG (Strictly Matched Layout) */}
      {/* ======================================================== */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" /> Employee Breakdown
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="mt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Name
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedEmployee.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Status
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold uppercase ${
                      selectedEmployee.status
                        ? "bg-green-500/10 text-green-600"
                        : "bg-zinc-500/10 text-zinc-500"
                    }`}
                  >
                    {selectedEmployee.status ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Role
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedEmployee.role}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Phone
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedEmployee.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Total Sales
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    <span className="font-black text-sm">৳</span>
                    {selectedEmployee.totalSales.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Join Date
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedEmployee.joinDate}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Commission Earned
                  </p>
                  <p className="text-base font-black text-green-600 mt-0.5">
                    <span className="font-black text-sm">৳</span>
                    {selectedEmployee.commissionEarned.toLocaleString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">
                  Description / Notes
                </p>
                <p className="text-sm text-foreground bg-background border border-border p-3 rounded-xl mt-1 min-h-16 whitespace-pre-wrap">
                  {selectedEmployee.description ||
                    "No description provided for this staff member."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button
              className="w-full rounded-xl h-11"
              onClick={() => setIsViewOpen(false)}
            >
              Close View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 2. ADD / EDIT DIALOG (Shadcn Architecture) */}
      {/* ======================================================== */}
      <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
              {selectedEmployee ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full Name
              </Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                className="rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone
                </Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+880 17xx..."
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales Executive">
                      Sales Executive
                    </SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Junior Associate">
                      Junior Associate
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Sales (৳)
                </Label>
                <Input
                  type="number"
                  value={formData.totalSales}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalSales: Number(e.target.value),
                    })
                  }
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Commission (৳)
                </Label>
                <Input
                  type="number"
                  value={formData.commissionEarned}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commissionEarned: Number(e.target.value),
                    })
                  }
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Join Date
                </Label>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) =>
                    setFormData({ ...formData, joinDate: e.target.value })
                  }
                  className="rounded-xl h-10"
                />
              </div>
              <div className="flex items-center gap-2 pt-5 pl-1">
                <Checkbox
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, status: !!checked })
                  }
                />
                <Label
                  htmlFor="status"
                  className="text-sm font-medium cursor-pointer"
                >
                  Active Status
                </Label>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description / Notes
              </Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add remarks..."
                className="rounded-xl resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-11"
                onClick={() => setIsAddEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl h-11">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 3. DELETE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to remove{" "}
              <span className="font-bold text-foreground">
                {selectedEmployee?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
