import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import QRCode from "npm:qrcode@1.5.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQRRequest {
  order_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { order_id }: GenerateQRRequest = await req.json();

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, items(title)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Verify seller is the current user
    if (order.seller_id !== user.id) {
      throw new Error('Only seller can generate QR code');
    }

    // Verify order is pending
    if (order.status !== 'pending') {
      throw new Error('Order is not in pending status');
    }

    // Generate expiry time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Create QR data with signature
    const timestamp = Date.now();
    const qrData = {
      order_id: order_id,
      seller_id: user.id,
      timestamp: timestamp,
    };

    // Generate signature (simple hash - in production use stronger hashing)
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(qrData) + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    qrData['signature'] = signature;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Update order with QR details
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        qr_code: qrCodeDataUrl,
        qr_signature: signature,
        qr_expires_at: expiresAt.toISOString(),
        qr_used: false,
      })
      .eq('id', order_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`QR code generated for order ${order_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        qr_code: qrCodeDataUrl,
        expires_at: expiresAt.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating QR code:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});