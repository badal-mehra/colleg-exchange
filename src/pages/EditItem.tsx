import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EditItem = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    location: '',
    is_negotiable: true,
    whatsapp_number: '',
  });

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        toast({ title: 'Error', description: 'Listing not found', variant: 'destructive' });
        navigate('/my-listings');
        return;
      }
      if (data.seller_id !== user.id) {
        toast({ title: 'Unauthorized', description: 'You can only edit your own listings', variant: 'destructive' });
        navigate('/my-listings');
        return;
      }
      setForm({
        title: data.title || '',
        description: data.description || '',
        price: String(data.price ?? ''),
        condition: data.condition || '',
        location: data.location || '',
        is_negotiable: data.is_negotiable ?? true,
        whatsapp_number: data.whatsapp_number || '',
      });
      setLoading(false);
    })();
  }, [id, user, navigate, toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    if (!form.title.trim() || !form.description.trim() || !form.price || !form.condition) {
      toast({ title: 'Missing fields', description: 'Fill all required fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('items')
      .update({
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        condition: form.condition,
        location: form.location.trim() || null,
        is_negotiable: form.is_negotiable,
        whatsapp_number: form.whatsapp_number.trim() || null,
      })
      .eq('id', id)
      .eq('seller_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved', description: 'Listing updated successfully' });
    navigate('/my-listings');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Edit Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹) *</Label>
                  <Input type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Condition *</Label>
                  <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="Optional" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="neg" checked={form.is_negotiable} onCheckedChange={(c) => setForm({ ...form, is_negotiable: !!c })} />
                <Label htmlFor="neg" className="cursor-pointer">Price is negotiable</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditItem;
