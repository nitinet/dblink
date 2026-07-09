import { sql } from 'dblink-core';
class IQuerySet {
    context;
    stat = new sql.Statement(sql.types.Command.SELECT);
    columnFieldMap = new Map();
    async single() {
        const arr = await this.list();
        if (arr.length > 1)
            throw new Error('More than one row found in unique call');
        else if (arr.length == 0)
            return null;
        else
            return arr[0];
    }
    async singleOrThrow() {
        const val = await this.single();
        if (!val)
            throw new Error('Value Not Found');
        return val;
    }
}
export default IQuerySet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSVF1ZXJ5U2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSVF1ZXJ5U2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUtBLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxhQUFhLENBQUM7QUE0QmxDLE1BQWUsU0FBUztJQU10QixPQUFPLENBQVc7SUFPbEIsSUFBSSxHQUFrQixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFbEUsY0FBYyxHQUFHLElBQUksR0FBRyxFQUFtQixDQUFDO0lBcUQ1QyxLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzlCLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO2FBQ3pFLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQUUsT0FBTyxJQUFJLENBQUM7O1lBQ2pDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFRRCxLQUFLLENBQUMsYUFBYTtRQUNqQixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsR0FBRztZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUM3QyxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7Q0FtREY7QUFFRCxlQUFlLFNBQVMsQ0FBQyJ9