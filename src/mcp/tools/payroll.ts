import { z } from 'zod';
import type { MCPTool } from '../types.js';
import { getUserOrThrow } from '../../store/index.js';
import { generateFolio, generateCLABE } from '../../utils/id.js';
import { formatMXN, calculateInstallment } from '../../utils/currency.js';

// ═══════════════════════════════════════════════════════════
// NÓMINA — Adelanto de Sueldo
// ═══════════════════════════════════════════════════════════

export const checkPayrollEligibility: MCPTool = {
  name: 'check_payroll_eligibility',
  description:
    'Verifica si el usuario califica para un adelanto de nómina. Calcula el monto máximo disponible (hasta 50% del sueldo neto), las fechas de cobro y la tasa de interés aplicable.',
  parameters: z.object({
    user_id: z.string().describe('ID del usuario'),
  }),
  execute: async (params: { user_id: string }) => {
    const user = getUserOrThrow(params.user_id);

    const maxAmount = Math.floor(user.salary * 0.5);
    const annualRate = 0.18; // 18% anual
    const now = new Date();

    // Calculate next payday
    const nextPayday = new Date(now);
    nextPayday.setDate(user.payrollDay);
    if (nextPayday <= now) {
      nextPayday.setMonth(nextPayday.getMonth() + 1);
    }

    const daysUntilPayday = Math.ceil(
      (nextPayday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      eligible: true,
      user_name: user.name,
      salary: user.salary,
      salary_formatted: formatMXN(user.salary),
      max_amount: maxAmount,
      max_amount_formatted: formatMXN(maxAmount),
      annual_interest_rate: annualRate,
      annual_interest_rate_display: `${(annualRate * 100).toFixed(0)}%`,
      next_payday: nextPayday.toISOString().slice(0, 10),
      days_until_payday: daysUntilPayday,
      available_installments: [1, 2, 3, 4, 6],
      message: `Puedes adelantar hasta ${formatMXN(maxAmount)} (50% de tu sueldo). Tu próximo pago de nómina es en ${daysUntilPayday} días.`,
    };
  },
};

export const disburseAdvance: MCPTool = {
  name: 'disburse_advance',
  description:
    'Ejecuta la dispersión de un adelanto de nómina vía SPEI. El monto se descuenta automáticamente del siguiente pago de nómina según el número de parcialidades elegidas.',
  parameters: z.object({
    amount: z.number().describe('Monto del adelanto en MXN'),
    installments: z.number().describe('Número de parcialidades (1, 2, 3, 4 o 6)'),
  }),
  execute: async (params: { amount: number; installments: number }) => {
    const user = getUserOrThrow('usr_banorte_demo');
    const maxAmount = Math.floor(user.salary * 0.5);

    if (params.amount > maxAmount) {
      throw new Error(
        `El monto solicitado (${formatMXN(params.amount)}) excede el máximo permitido (${formatMXN(maxAmount)}).`
      );
    }

    const annualRate = 0.18;
    const installmentAmount = calculateInstallment(
      params.amount,
      annualRate,
      params.installments
    );

    const folio = generateFolio();
    const clabe = user.clabe;

    // Calculate deduction dates
    const now = new Date();
    const deductions: string[] = [];
    for (let i = 0; i < params.installments; i++) {
      const deductionDate = new Date(now);
      deductionDate.setDate(user.payrollDay);
      deductionDate.setMonth(deductionDate.getMonth() + i + 1);
      deductions.push(deductionDate.toISOString().slice(0, 10));
    }

    return {
      folio,
      status: 'dispersed',
      amount: params.amount,
      amount_formatted: formatMXN(params.amount),
      installments: params.installments,
      installment_amount: Math.round(installmentAmount * 100) / 100,
      installment_amount_formatted: formatMXN(
        Math.round(installmentAmount * 100) / 100
      ),
      total_to_pay: Math.round(installmentAmount * params.installments * 100) / 100,
      total_to_pay_formatted: formatMXN(
        Math.round(installmentAmount * params.installments * 100) / 100
      ),
      interest_cost: Math.round(
        (installmentAmount * params.installments - params.amount) * 100
      ) / 100,
      interest_cost_formatted: formatMXN(
        Math.round(
          (installmentAmount * params.installments - params.amount) * 100
        ) / 100
      ),
      clabe,
      first_deduction: deductions[0],
      deduction_dates: deductions,
      spei_reference: folio,
      message: `💰 Adelanto de ${formatMXN(params.amount)} dispersado vía SPEI a tu cuenta •••• ${clabe.slice(-4)}. Folio: ${folio}. Se descontará en ${params.installments} parcialidad(es) de ${formatMXN(Math.round(installmentAmount * 100) / 100)}.`,
    };
  },
};

// ─── Export all Payroll tools ───────────────────────────
export const payrollTools: MCPTool[] = [
  checkPayrollEligibility,
  disburseAdvance,
];
