import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, PlayCircle, PauseCircle, Archive, RefreshCw, AlertCircle } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  daily_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  objective: string | null;
}

interface AdAccount {
  name: string | null;
  currency: string | null;
}

export default function CampaignsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adAccount, setAdAccount] = useState<AdAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: accountData, error: accountError } = await supabase
          .from('ad_accounts')
          .select('name, currency')
          .eq('id', id)
          .single();

        if (accountError) throw accountError;
        setAdAccount(accountData);

        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('ad_account_id', id)
          .order('created_at', { ascending: false });

        if (campaignsError) throw campaignsError;

        const typedCampaigns: Campaign[] = (campaignsData || []).map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status as 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
          daily_budget: campaign.daily_budget,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          objective: campaign.objective
        }));

        setCampaigns(typedCampaigns);
      } catch (err: any) {
        toast({
          title: "Error",
          description: "Failed to load campaigns. Please try again.",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate, toast]);

  const syncCampaigns = async () => {
    if (!adAccount) return;
    
    setSyncing(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('meta_access_token')
        .single();

      if (!profile?.meta_access_token) {
        toast({
          title: "Error",
          description: "Meta access token not found. Please reconnect your Meta account.",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('sync-campaigns', {
        body: {
          adAccountId: id,
          accessToken: profile.meta_access_token,
        },
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to sync campaigns');
      }

      toast({
        title: "Success",
        description: "Campaigns synced successfully",
      });

      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('ad_account_id', id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      const typedCampaigns: Campaign[] = (campaignsData || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status as 'ACTIVE' | 'PAUSED' | 'ARCHIVED',
        daily_budget: campaign.daily_budget,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        objective: campaign.objective
      }));

      setCampaigns(typedCampaigns);

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to sync campaigns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <PlayCircle className="h-4 w-4 text-green-500" />;
      case 'PAUSED':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'ARCHIVED':
        return <Archive className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (campaigns.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">No Campaigns Found</h3>
              <p className="text-muted-foreground">
                This ad account doesn't have any campaigns yet. You can:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Create a new campaign</li>
                <li>Sync existing campaigns from Meta</li>
                <li>Check Meta Business Manager for campaign status</li>
              </ul>
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={syncCampaigns}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync Campaigns
                </Button>
                <Button className="bg-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(campaign.status)}
                {campaign.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {campaign.daily_budget && (
                <p className="text-sm text-muted-foreground">
                  Daily Budget: {adAccount?.currency}{campaign.daily_budget}
                </p>
              )}
              {campaign.objective && (
                <p className="text-sm text-muted-foreground">
                  Objective: {campaign.objective}
                </p>
              )}
              {campaign.start_date && (
                <p className="text-sm text-muted-foreground">
                  Start Date: {new Date(campaign.start_date).toLocaleDateString()}
                  {campaign.end_date && ` - End Date: ${new Date(campaign.end_date).toLocaleDateString()}`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button
            variant="ghost"
            className="mb-2"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">
            Campaigns for {adAccount?.name || 'Loading...'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={syncCampaigns}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Campaigns
          </Button>
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
