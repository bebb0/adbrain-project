import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Facebook } from "lucide-react";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { toast } = useToast();

  const handleMetaLogin = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          scopes: 'ads_management,ads_read,business_management,pages_manage_ads',
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <div className="container relative min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="border-2">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in with your Meta Business account to continue
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button 
              onClick={handleMetaLogin}
              className="w-full bg-[#1877F2] hover:bg-[#0c64d8]"
            >
              <Facebook className="mr-2 h-4 w-4" />
              Continue with Meta Business
            </Button>
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <a href="/terms" className="underline hover:text-brand-600">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-brand-600">
                Privacy Policy
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
