import { Link } from "react-router-dom";
import React from "react";
import { useUser } from "@clerk/clerk-react";
import {
  LogOut,
  Settings,
  PiggyBank,
  User,
  Download,
  Upload,
  Copy as CopyIcon,
  Receipt
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { t } from "@/lib/utils";

interface UserNavProps {
  onLogout: () => void;
  onExport?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCopyPreviousMonth?: () => void;
}

export function UserNav({ onLogout, onExport, onImport, onCopyPreviousMonth }: UserNavProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useUser();

  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User';
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.primaryEmailAddress?.emailAddress?.[0].toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
          <Avatar className="h-9 w-9 border border-gray-100 dark:border-gray-800">
            <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white text-xs font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a href="https://rich-bobcat-66.accounts.dev/user" target="_blank" rel="noopener noreferrer">
              <User className="mr-2 h-4 w-4 text-purple-600" />
              <span>Profile</span>
            </a>
          </DropdownMenuItem>
          <Link to="/expenses">
            <DropdownMenuItem className="cursor-pointer">
              <Receipt className="mr-2 h-4 w-4 text-blue-600" />
              <span>Daily Expenses</span>
            </DropdownMenuItem>
          </Link>
          <Link to="/savings-goals">
            <DropdownMenuItem className="cursor-pointer">
              <PiggyBank className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Savings Goals</span>
            </DropdownMenuItem>
          </Link>
          <Link to="/settings">
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-slate-600" />
              <span>{t('settings')}</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">Data Management</DropdownMenuLabel>
          {onCopyPreviousMonth && (
            <DropdownMenuItem className="cursor-pointer" onClick={onCopyPreviousMonth}>
              <CopyIcon className="mr-2 h-4 w-4 text-blue-600" />
              <span>Copy Previous Month</span>
            </DropdownMenuItem>
          )}
          {onExport && (
            <DropdownMenuItem className="cursor-pointer" onClick={onExport}>
              <Download className="mr-2 h-4 w-4 text-green-600" />
              <span>Export Data</span>
            </DropdownMenuItem>
          )}
          {onImport && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  if (onImport && e.target.files?.[0]) {
                    onImport(e);
                  }
                }}
              />
              <DropdownMenuItem 
                className="cursor-pointer" 
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="mr-2 h-4 w-4 text-purple-600" />
                <span>Import Data</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30" 
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
