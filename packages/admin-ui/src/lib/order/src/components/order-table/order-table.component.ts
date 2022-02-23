import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AdjustmentType, CustomFieldConfig, OrderDetailFragment } from '@vendure/admin-ui/core';

@Component({
    selector: 'vdr-order-table',
    templateUrl: './order-table.component.html',
    styleUrls: ['./order-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderTableComponent implements OnInit {
    @Input() order: OrderDetailFragment;
    @Input() orderLineCustomFields: CustomFieldConfig[];
    orderLineCustomFieldsVisible = false;
    customFieldsForLine: {
        [lineId: string]: Array<{ config: CustomFieldConfig; formGroup: FormGroup; value: any }>;
    } = {};

    get visibleOrderLineCustomFields(): CustomFieldConfig[] {
        return this.orderLineCustomFieldsVisible ? this.orderLineCustomFields : [];
    }

    get showElided(): boolean {
        return !this.orderLineCustomFieldsVisible && 0 < this.orderLineCustomFields.length;
    }

    ngOnInit(): void {
        this.orderLineCustomFieldsVisible = this.orderLineCustomFields.length < 2;
        this.getLineCustomFields();
    }

    toggleOrderLineCustomFields() {
        this.orderLineCustomFieldsVisible = !this.orderLineCustomFieldsVisible;
    }

    getLineDiscounts(line: OrderDetailFragment['lines'][number]) {
        return line.discounts.filter(a => a.type === AdjustmentType.PROMOTION);
    }

    private getLineCustomFields() {
        for (const line of this.order.lines) {
            const formGroup = new FormGroup({});
            const result = this.orderLineCustomFields
                .map(config => {
                    const value = (line as any).customFields[config.name];
                    formGroup.addControl(config.name, new FormControl(value));
                    return {
                        config,
                        formGroup,
                        value,
                    };
                })
                .filter(field => {
                    return this.orderLineCustomFieldsVisible ? true : field.value != null;
                });
            this.customFieldsForLine[line.id] = result;
        }
    }

    getPromotionLink(promotion: OrderDetailFragment['discounts'][number]): any[] {
        const id = promotion.adjustmentSource.split(':')[1];
        return ['/marketing', 'promotions', id];
    }

    getCouponCodeForAdjustment(
        order: OrderDetailFragment,
        promotionAdjustment: OrderDetailFragment['discounts'][number],
    ): string | undefined {
        const id = promotionAdjustment.adjustmentSource.split(':')[1];
        const promotion = order.promotions.find(p => p.id === id);
        if (promotion) {
            return promotion.couponCode || undefined;
        }
    }
}
