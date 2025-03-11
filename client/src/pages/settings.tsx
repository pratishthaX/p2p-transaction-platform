import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  const handlePasswordChange = () => {
    // Validate password fields
    toast({
      title: "Password Updated",
      description: "Your password has been updated successfully.",
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <Header onMenuToggle={toggleSidebar} />
        
        {/* Settings Content */}
        <main className="flex-1 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <div className="pb-5 border-b border-gray-200">
              <h3 className="text-2xl font-bold leading-6 text-gray-900">Account Settings</h3>
            </div>

            {/* Settings Tabs */}
            <div className="mt-6">
              <Tabs defaultValue="account">
                <TabsList className="mb-6">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="payment">Payment Methods</TabsTrigger>
                </TabsList>
                
                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-medium leading-6 text-gray-900">Account Information</h4>
                      <p className="text-sm text-gray-500">Update your account details and profile information.</p>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <Input value={user?.username || "johnsmith"} readOnly className="bg-gray-50" />
                          <p className="text-xs text-gray-500 mt-1">Your username cannot be changed.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <Input value={user?.email || "john.smith@example.com"} />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Profile Visibility</h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="show-email" className="font-normal">Show email to other users</Label>
                              <p className="text-xs text-gray-500">Allow other users to see your email address.</p>
                            </div>
                            <Switch id="show-email" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="show-transactions" className="font-normal">Show transaction history</Label>
                              <p className="text-xs text-gray-500">Display your transaction history on your public profile.</p>
                            </div>
                            <Switch id="show-transactions" />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Account Actions</h5>
                        <div className="space-y-4">
                          <Button variant="outline" className="w-full sm:w-auto">
                            <i className="fas fa-download mr-2"></i>
                            Download Account Data
                          </Button>
                          <Button variant="destructive" className="w-full sm:w-auto">
                            <i className="fas fa-trash-alt mr-2"></i>
                            Delete Account
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Deleting your account will permanently remove all your data from our servers.</p>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-gray-50 flex justify-end p-4">
                      <Button onClick={handleSaveSettings}>Save Changes</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-medium leading-6 text-gray-900">Security Settings</h4>
                      <p className="text-sm text-gray-500">Manage your account security preferences.</p>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Change Password</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <Input type="password" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <Input type="password" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <Input type="password" />
                          </div>
                          <div>
                            <Button onClick={handlePasswordChange}>Change Password</Button>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Two-Factor Authentication</h5>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <Label htmlFor="2fa-toggle" className="font-normal">Enable Two-Factor Authentication</Label>
                            <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                          </div>
                          <Switch id="2fa-toggle" />
                        </div>
                        <Button variant="outline">
                          <i className="fas fa-mobile-alt mr-2"></i>
                          Setup 2FA
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Session Management</h5>
                        <div className="border rounded-md p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h6 className="text-sm font-medium text-gray-900">Current Session</h6>
                              <p className="text-xs text-gray-500">Chrome on macOS - Last active now</p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" className="mt-4">
                          <i className="fas fa-sign-out-alt mr-2"></i>
                          Logout All Other Devices
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-medium leading-6 text-gray-900">Notification Preferences</h4>
                      <p className="text-sm text-gray-500">Manage how you receive notifications.</p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Transaction Notifications</h5>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="new-transaction" className="font-normal">New Transaction</Label>
                                <p className="text-xs text-gray-500">Receive notifications when someone initiates a transaction with you.</p>
                              </div>
                              <Switch id="new-transaction" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="transaction-status" className="font-normal">Transaction Status Updates</Label>
                                <p className="text-xs text-gray-500">Receive notifications when your transaction status changes.</p>
                              </div>
                              <Switch id="transaction-status" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="escrow-release" className="font-normal">Escrow Releases</Label>
                                <p className="text-xs text-gray-500">Receive notifications when funds are released from escrow.</p>
                              </div>
                              <Switch id="escrow-release" defaultChecked />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Account Notifications</h5>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="new-review" className="font-normal">New Reviews</Label>
                                <p className="text-xs text-gray-500">Receive notifications when someone reviews you.</p>
                              </div>
                              <Switch id="new-review" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="security-alerts" className="font-normal">Security Alerts</Label>
                                <p className="text-xs text-gray-500">Receive notifications about security-related events.</p>
                              </div>
                              <Switch id="security-alerts" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="newsletter" className="font-normal">Newsletter & Updates</Label>
                                <p className="text-xs text-gray-500">Receive product updates and occasional newsletter.</p>
                              </div>
                              <Switch id="newsletter" />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Notification Channels</h5>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="email-notifications" className="font-normal">Email Notifications</Label>
                                <p className="text-xs text-gray-500">Receive notifications via email.</p>
                              </div>
                              <Switch id="email-notifications" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="browser-notifications" className="font-normal">Browser Notifications</Label>
                                <p className="text-xs text-gray-500">Receive notifications in your browser.</p>
                              </div>
                              <Switch id="browser-notifications" defaultChecked />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-gray-50 flex justify-end p-4">
                      <Button onClick={handleSaveSettings}>Save Preferences</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="payment">
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-medium leading-6 text-gray-900">Payment Methods</h4>
                      <p className="text-sm text-gray-500">Manage your payment methods and preferences.</p>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Current Payment Methods</h5>
                          <div className="space-y-3">
                            <div className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <i className="fas fa-credit-card"></i>
                                  </div>
                                  <div className="ml-3">
                                    <h6 className="text-sm font-medium text-gray-900">Visa ending in 1234</h6>
                                    <p className="text-xs text-gray-500">Expires 09/2024</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-primary-600 font-medium">Default</span>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <i className="fas fa-ellipsis-v"></i>
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border border-dashed rounded-lg p-4 flex items-center justify-center">
                              <Button variant="outline">
                                <i className="fas fa-plus mr-2"></i>
                                Add Payment Method
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Billing Address</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                              <Input value="John Smith" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                              <Input value="123 Main St" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                              <Input value="Apt 4B" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                              <Input value="New York" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                              <Input value="NY" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                              <Input value="10001" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                              <Input value="United States" />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Billing Preferences</h5>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="auto-payment" className="font-normal">Automatic Payments</Label>
                                <p className="text-xs text-gray-500">Allow automatic payments for recurring transactions.</p>
                              </div>
                              <Switch id="auto-payment" />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label htmlFor="digital-receipts" className="font-normal">Digital Receipts</Label>
                                <p className="text-xs text-gray-500">Receive digital receipts for all transactions.</p>
                              </div>
                              <Switch id="digital-receipts" defaultChecked />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-gray-50 flex justify-end p-4">
                      <Button onClick={handleSaveSettings}>Save Changes</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <MobileNavigation onCreateTransaction={() => {}} />
      </div>
    </div>
  );
}
