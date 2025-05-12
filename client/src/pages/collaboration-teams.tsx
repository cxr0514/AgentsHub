import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  Plus, 
  Home,
  ArrowLeft,
  Building2,
  Loader2,
  MoreHorizontal,
  Trash2,
  PenLine,
  ListFilter,
  Check,
  X,
  UserMinus,
  UserCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the types for our data
interface CollaborationTeam {
  id: number;
  name: string;
  ownerId: number;
  description: string | null;
  createdAt: string;
  members?: TeamMember[];
  properties?: Property[];
}

interface TeamMember {
  userId: number;
  teamId: number;
  role: string | null;
  joinedAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: string;
  bedrooms: number;
  bathrooms: string;
  squareFeet: string;
  mainImageUrl?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

export default function CollaborationTeamsPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addPropertyDialogOpen, setAddPropertyDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<CollaborationTeam | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);
  
  // Fetch user's teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/collaboration/teams"],
    enabled: !!user
  });
  
  // Fetch team details when a team is selected
  const { data: teamDetails, isLoading: teamDetailsLoading } = useQuery({
    queryKey: ["/api/collaboration/teams", selectedTeamId, "details"],
    enabled: !!selectedTeamId,
  });
  
  // Fetch user's properties for adding to team
  const { data: userProperties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ["/api/properties/my-properties"],
    enabled: addPropertyDialogOpen && !!selectedTeamId,
  });
  
  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch("/api/collaboration/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create team");
      }
      
      return res.json();
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/teams"] });
      setCreateTeamDialogOpen(false);
      setTeamName("");
      setTeamDescription("");
      toast({
        title: "Team created",
        description: `Team "${newTeam.name}" has been created successfully`,
      });
      setSelectedTeamId(newTeam.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating team",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Add team member mutation
  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: { teamId: number; email: string; role: string }) => {
      const res = await fetch(`/api/collaboration/teams/${data.teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: data.email, role: data.role })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add team member");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/teams", selectedTeamId, "details"] });
      setAddMemberDialogOpen(false);
      setMemberEmail("");
      setMemberRole("Member");
      toast({
        title: "Member added",
        description: "Team member has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: async (data: { teamId: number; userId: number }) => {
      const res = await fetch(`/api/collaboration/teams/${data.teamId}/members/${data.userId}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to remove team member");
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/teams", selectedTeamId, "details"] });
      toast({
        title: "Member removed",
        description: "Team member has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Add property to team mutation
  const addPropertyToTeamMutation = useMutation({
    mutationFn: async (data: { teamId: number; propertyId: number }) => {
      const res = await fetch(`/api/collaboration/teams/${data.teamId}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ propertyId: data.propertyId })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add property to team");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/teams", selectedTeamId, "details"] });
      setAddPropertyDialogOpen(false);
      toast({
        title: "Property added",
        description: "Property has been added to the team",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding property",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Remove property from team mutation
  const removePropertyFromTeamMutation = useMutation({
    mutationFn: async (data: { teamId: number; propertyId: number }) => {
      const res = await fetch(`/api/collaboration/teams/${data.teamId}/properties/${data.propertyId}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to remove property from team");
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/teams", selectedTeamId, "details"] });
      toast({
        title: "Property removed",
        description: "Property has been removed from the team",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing property",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const res = await fetch(`/api/collaboration/teams/${teamId}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete team");
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/teams"] });
      setSelectedTeamId(null);
      toast({
        title: "Team deleted",
        description: "Team has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting team",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleCreateTeam = () => {
    if (!teamName) return;
    
    createTeamMutation.mutate({
      name: teamName,
      description: teamDescription || undefined
    });
  };
  
  const handleAddMember = () => {
    if (!selectedTeamId || !memberEmail) return;
    
    addTeamMemberMutation.mutate({
      teamId: selectedTeamId,
      email: memberEmail,
      role: memberRole
    });
  };
  
  const handleAddProperty = (propertyId: number) => {
    if (!selectedTeamId) return;
    
    addPropertyToTeamMutation.mutate({
      teamId: selectedTeamId,
      propertyId
    });
  };
  
  const isTeamOwner = (team: CollaborationTeam) => {
    return user && team.ownerId === user.id;
  };
  
  // Loading state
  if (!user) {
    return null; // Will redirect to auth
  }
  
  const isLoading = teamsLoading;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/shared-properties">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shared Properties
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Team Collaboration</h1>
          <p className="text-muted-foreground">Create and manage collaboration teams for properties</p>
        </div>
        
        <Button onClick={() => setCreateTeamDialogOpen(true)}>
          <Users className="mr-2 h-4 w-4" />
          Create New Team
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : teams.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-center">No Teams Found</CardTitle>
            <CardDescription className="text-center">
              You are not a member of any collaboration teams yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-center text-muted-foreground mb-6">
              Teams allow you to collaborate with others on properties. 
              Create a team to get started!
            </p>
            <Button onClick={() => setCreateTeamDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Your Teams</h2>
              <div className="space-y-2">
                {teams.map((team: CollaborationTeam) => (
                  <div 
                    key={team.id}
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-accent ${
                      selectedTeamId === team.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isTeamOwner(team) ? 'Owner' : 'Member'}
                        </p>
                      </div>
                    </div>
                    {isTeamOwner(team) && (
                      <Badge variant="outline" className="ml-2">Owner</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            {selectedTeamId ? (
              teamDetailsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : teamDetails ? (
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center">
                        <h2 className="text-2xl font-bold">{teamDetails.name}</h2>
                        {isTeamOwner(teamDetails) && (
                          <Badge variant="outline" className="ml-3">Owner</Badge>
                        )}
                      </div>
                      {teamDetails.description && (
                        <p className="text-muted-foreground mt-1">{teamDetails.description}</p>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Team Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isTeamOwner(teamDetails) && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => setAddMemberDialogOpen(true)}
                              className="cursor-pointer"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Member
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setAddPropertyDialogOpen(true)}
                              className="cursor-pointer"
                            >
                              <Building2 className="h-4 w-4 mr-2" />
                              Add Property
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteTeamMutation.mutate(teamDetails.id)}
                              className="text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Team
                            </DropdownMenuItem>
                          </>
                        )}
                        {!isTeamOwner(teamDetails) && (
                          <DropdownMenuItem 
                            onClick={() => removeTeamMemberMutation.mutate({
                              teamId: teamDetails.id,
                              userId: user!.id
                            })}
                            className="text-destructive cursor-pointer"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Leave Team
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Tabs defaultValue="members">
                    <TabsList className="mb-6">
                      <TabsTrigger value="members">
                        <Users className="h-4 w-4 mr-2" />
                        Members
                      </TabsTrigger>
                      <TabsTrigger value="properties">
                        <Building2 className="h-4 w-4 mr-2" />
                        Properties
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="members">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle>Team Members</CardTitle>
                            {isTeamOwner(teamDetails) && (
                              <Button 
                                size="sm" 
                                onClick={() => setAddMemberDialogOpen(true)}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Member
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {teamDetails.members?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                              <p>No members in this team yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {teamDetails.members?.map((member: TeamMember) => (
                                <div key={member.userId} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Avatar className="h-10 w-10 mr-3">
                                      <AvatarFallback>
                                        {member.user?.username?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{member.user?.username}</p>
                                      <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-3">
                                      {member.role || "Member"}
                                    </Badge>
                                    {member.userId === teamDetails.ownerId && (
                                      <Badge className="ml-2">Owner</Badge>
                                    )}
                                  </div>
                                  
                                  {isTeamOwner(teamDetails) && member.userId !== user?.id && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeTeamMemberMutation.mutate({
                                        teamId: teamDetails.id,
                                        userId: member.userId
                                      })}
                                    >
                                      <UserMinus className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="properties">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle>Team Properties</CardTitle>
                            {isTeamOwner(teamDetails) && (
                              <Button 
                                size="sm" 
                                onClick={() => setAddPropertyDialogOpen(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Property
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {teamDetails.properties?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                              <p>No properties in this team yet.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {teamDetails.properties?.map((property: Property) => (
                                <Card key={property.id} className="overflow-hidden">
                                  <div className="h-32 bg-muted">
                                    {property.mainImageUrl ? (
                                      <img 
                                        src={property.mainImageUrl} 
                                        alt={property.address} 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Home className="h-8 w-8 text-muted-foreground/50" />
                                      </div>
                                    )}
                                  </div>
                                  <CardContent className="p-4">
                                    <h3 className="font-semibold line-clamp-1 mb-1">
                                      {property.address}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {property.city}, {property.state} {property.zipCode}
                                    </p>
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-sm font-semibold">
                                          ${property.price}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {property.bedrooms} bd • {property.bathrooms} ba • {property.squareFeet} sqft
                                        </p>
                                      </div>
                                      
                                      {isTeamOwner(teamDetails) && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removePropertyFromTeamMutation.mutate({
                                            teamId: teamDetails.id,
                                            propertyId: property.id
                                          })}
                                        >
                                          <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Unable to load team details. Please try again.
                  </AlertDescription>
                </Alert>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-16 w-16 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Team</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a team from the sidebar to view its members and properties
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Create Team Dialog */}
      <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a team to collaborate with others on properties
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-name" className="text-right">
                Team Name
              </Label>
              <Input
                id="team-name"
                placeholder="Enter team name"
                className="col-span-3"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="team-description"
                placeholder="Optional team description"
                className="col-span-3"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTeamDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTeam}
              disabled={!teamName || createTeamMutation.isPending}
            >
              {createTeamMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a member to collaborate on team properties
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member-email" className="text-right">
                Email
              </Label>
              <Input
                id="member-email"
                type="email"
                placeholder="member@example.com"
                className="col-span-3"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member-role" className="text-right">
                Role
              </Label>
              <select
                id="member-role"
                className="col-span-3 p-2 border rounded-md"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
              >
                <option value="Member">Member</option>
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
                <option value="Viewer">Viewer (Read-only)</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={!memberEmail || addTeamMemberMutation.isPending}
            >
              {addTeamMemberMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Property Dialog */}
      <Dialog open={addPropertyDialogOpen} onOpenChange={setAddPropertyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Property to Team</DialogTitle>
            <DialogDescription>
              Select a property to add to this team
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {propertiesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : userProperties.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">You don't have any properties to add.</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/properties/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add a Property
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {userProperties.map((property: Property) => (
                  <div 
                    key={property.id} 
                    className="flex items-start border-b py-3"
                  >
                    <div className="h-16 w-16 rounded bg-muted mr-3 flex-shrink-0">
                      {property.mainImageUrl ? (
                        <img 
                          src={property.mainImageUrl} 
                          alt={property.address} 
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">{property.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.city}, {property.state}
                      </p>
                      <p className="text-sm">
                        {property.bedrooms} bed • {property.bathrooms} bath • ${property.price}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => handleAddProperty(property.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPropertyDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}