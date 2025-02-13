import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Coins, Globe, AlertCircle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

interface AdAccount {
  id: string;
  name: string | null;
  currency: string | null;
  timezone: string | null;
}

interface Profile {
  meta_access_token: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [personalToken, setPersonalToken] = useState<string>(() => {
    return localStorage.getItem('meta_personal_token') || '';
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        navigate("/auth/login");
        return;
      }

      if (!session) {
        navigate("/auth/login");
        return;
      }

      try {
        // First, fetch user profile to check Meta connection
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('meta_access_token')
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Then fetch ad accounts
        const { data: accounts, error: fetchError } = await supabase
          .from('ad_accounts')
          .select('*')
          .order('name');

        if (fetchError) throw fetchError;
        setAdAccounts(accounts || []);
      } catch (err: any) {
        toast({
          title: "Error",
          description: "Failed to load account data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate, toast]);

  const handleTokenSave = async () => {
    try {
      localStorage.setItem('meta_personal_token', personalToken);
      
      // Update the token in the database as well
      const { error } = await supabase
        .from('profiles')
        .update({ meta_access_token: personalToken })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      // Sync ad accounts using the new token
      const response = await supabase.functions.invoke('sync-ad-accounts', {
        body: { accessToken: personalToken }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to sync ad accounts');
      }

      toast({
        title: "Success",
        description: "Token saved and ad accounts synced successfully",
      });

      // Reload the page to refresh the data
      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save token. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Development Token Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Development Access Token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              For development purposes, enter your Meta Marketing API access token here. 
              You can generate one in the {' '}
              <a 
                href="https://developers.facebook.com/tools/explorer/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Graph API Explorer
              </a>.
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your Meta access token"
                value={personalToken}
                onChange={(e) => setPersonalToken(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTokenSave}>
                Save Token
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ad Accounts Section */}
        {adAccounts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">No Ad Accounts Found</h3>
                <p className="text-muted-foreground">
                  We couldn't find any Meta ad accounts associated with your profile. 
                  Make sure you have:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Entered a valid access token above</li>
                  <li>Created a Meta Business Manager account</li>
                  <li>Created at least one ad account</li>
                  <li>Granted necessary permissions to this application</li>
                </ul>
                <Button 
                  className="mt-4"
                  onClick={() => window.open('https://business.facebook.com/settings', '_blank')}
                >
                  Go to Meta Business Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adAccounts.map((account) => (
              <Card 
                key={account.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/campaigns/${account.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {account.name || 'Unnamed Account'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Coins className="h-4 w-4" />
                    <span>{account.currency || 'No currency set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>{account.timezone || 'No timezone set'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meta Marketing Dashboard</h1>
      </div>

      {renderContent()}
    </div>
  );
}
