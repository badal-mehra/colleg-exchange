import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyQRRequest {
  qr_data: {
    order_id: string;
    seller_id: string;
    timestamp: number;
    signature: string;
  };
  confirm?: boolean;
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

    const { qr_data, confirm = false }: VerifyQRRequest = await req.json();

    // Verify signature
    const dataToVerify = {
      order_id: qr_data.order_id,
      seller_id: qr_data.seller_id,
      timestamp: qr_data.timestamp,
    };
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(dataToVerify) + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (expectedSignature !== qr_data.signature) {
      throw new Error('Invalid QR code signature');
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, items(title, price), seller:profiles!orders_seller_id_fkey(full_name, mck_id)')
      .eq('id', qr_data.order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Verify buyer is the current user
    if (order.buyer_id !== user.id) {
      throw new Error('Only the buyer can confirm this order');
    }

    // Verify buyer is not the seller
    if (order.buyer_id === order.seller_id) {
      throw new Error('Buyer and seller cannot be the same person');
    }

    // Check if order is pending
    if (order.status !== 'pending') {
      throw new Error('Order is not in pending status');
    }

    // Check if QR is expired
    if (!order.qr_expires_at || new Date(order.qr_expires_at) < new Date()) {
      throw new Error('QR code has expired. Please ask seller to regenerate.');
    }

    // Check if QR has been used
    if (order.qr_used) {
      throw new Error('QR code has already been used');
    }

    // Verify signature matches stored signature
    if (order.qr_signature !== qr_data.signature) {
      throw new Error('QR code signature mismatch');
    }

    // If not confirming yet, return order details for confirmation popup
    if (!confirm) {
      return new Response(
        JSON.stringify({
          success: true,
          action: 'confirm_required',
          order: {
            id: order.id,
            item_title: order.items.title,
            item_price: order.items.price,
            seller_name: order.seller.full_name,
            seller_mck_id: order.seller.mck_id,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Complete the order using the database function
    const { data: result, error: completeError } = await supabaseClient
      .rpc('complete_order', { order_id: qr_data.order_id });

    if (completeError) {
      throw completeError;
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to complete order');
    }

    console.log(`Order ${qr_data.order_id} completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        action: 'completed',
        message: 'Transaction confirmed successfully! Points awarded.',
        order: {
          id: order.id,
          item_title: order.items.title,
          seller_name: order.seller.full_name,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error verifying QR code:', error);
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