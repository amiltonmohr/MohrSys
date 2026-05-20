const Joi = require('joi');

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

export const clientSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(20).allow('', null),
  address: Joi.string().max(500).allow('', null),
  city: Joi.string().max(100).allow('', null),
  state: Joi.string().max(50).allow('', null),
  zip_code: Joi.string().max(20).allow('', null),
  country: Joi.string().max(50).default('Brasil'),
  notes: Joi.string().max(2000).allow('', null),
});

export const quoteInputSchema = Joi.object({
  reference_number: Joi.string().max(50).allow('', null),
  client_id: Joi.string().uuid().allow(null),
  client_name: Joi.string().max(255).allow('', null),
  description: Joi.string().max(500).allow('', null),
  product_type: Joi.string().valid('simples', 'bloco', 'revista').required(),
  paper_type: Joi.string().max(100).required(),
  paper_gramatura: Joi.string().max(20).required(),
  width_cm: Joi.number().positive().required(),
  height_cm: Joi.number().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  colors_front: Joi.number().integer().min(0).max(4).required(),
  colors_back: Joi.number().integer().min(0).max(4).required(),
  grafismo: Joi.number().valid(0.2, 0.4, 0.7, 1.0, 1.2).required(),
  margin_pct: Joi.number().min(0).max(300).required(),
  urgency_pct: Joi.number().min(0).max(100).default(0),
  machine_name: Joi.string().required(),
  finishing_specs: Joi.array().items(
    Joi.object({
      nome: Joi.string().required(),
      formula: Joi.string().required(),
      lados: Joi.number().integer().valid(1, 2),
      percArea: Joi.number().min(1).max(100),
      setup: Joi.number().min(0),
      valorMil: Joi.number().min(0),
      faca: Joi.number().min(0),
    })
  ).default([]),
  bloco_folhas: Joi.number().integer().positive().when('product_type', {
    is: 'bloco', then: Joi.required(), otherwise: Joi.allow(null),
  }),
  bloco_vias: Joi.number().integer().min(1).max(5).when('product_type', {
    is: 'bloco', then: Joi.required(), otherwise: Joi.allow(null),
  }),
  bloco_chapa_modo: Joi.string().valid('unica', 'por-via').when('product_type', {
    is: 'bloco', then: Joi.string().valid('unica', 'por-via').default('unica'), otherwise: Joi.allow(null),
  }),
  rev_paginas: Joi.number().integer().min(4).when('product_type', {
    is: 'revista', then: Joi.required(), otherwise: Joi.allow(null),
  }),
  rev_capa_papel: Joi.string().when('product_type', {
    is: 'revista', then: Joi.required(), otherwise: Joi.allow('', null),
  }),
  rev_capa_gram: Joi.string().when('product_type', {
    is: 'revista', then: Joi.required(), otherwise: Joi.allow('', null),
  }),
  rev_capa_cores_f: Joi.number().integer().min(0).max(4).default(4),
  rev_capa_cores_v: Joi.number().integer().min(0).max(4).default(0),
  rev_capa_finishing: Joi.array().default([]),
  tira_retira: Joi.boolean().default(true),
  comparison_quantities: Joi.array().items(Joi.number().integer().positive()).max(5).default([]),
});

export const configUpdateSchema = Joi.object({
  materials: Joi.array().items(
    Joi.object({
      tipo: Joi.string().required(),
      gramatura: Joi.string().required(),
      formato: Joi.string().required(),
      precoPorKg: Joi.number().positive().required(),
      fatorAbs: Joi.number().positive().required(),
    })
  ),
  machines: Joi.array().items(
    Joi.object({
      nome: Joi.string().required(),
      formato: Joi.string().required(),
      custoHora: Joi.number().positive().required(),
      velocidade: Joi.number().integer().positive().required(),
      pinca: Joi.number().positive().required(),
    })
  ),
  finishing: Joi.array().items(
    Joi.object({
      nome: Joi.string().required(),
      formula: Joi.string().required(),
      valorM2: Joi.number().min(0),
      valorMil: Joi.number().min(0),
      setup: Joi.number().min(0),
      valor: Joi.number().min(0),
      percArea: Joi.number().min(0).max(100),
    })
  ),
  chapa_cost_brl: Joi.number().positive(),
  ink_cost_cmyk_per_ml: Joi.number().positive(),
  ink_cost_pantone_per_ml: Joi.number().positive(),
  labor_cost_per_hour_brl: Joi.number().positive(),
  setup_cost_per_chapa_brl: Joi.number().positive(),
  overhead_pct: Joi.number().min(0).max(100),
  margin_pct: Joi.number().min(0).max(100),
});
