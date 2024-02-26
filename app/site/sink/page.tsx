import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const KitchenSinkPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-4xl font-bold mb-4">Heading 1</h1>
      <h2 className="text-3xl font-bold mb-4">Heading 2</h2>
      <h3 className="text-2xl font-bold mb-4">Heading 3</h3>
      <h4 className="text-xl font-bold mb-4">Heading 4</h4>
      <h5 className="text-lg font-bold mb-4">Heading 5</h5>
      <h6 className="text-base font-bold mb-4">Heading 6</h6>

      <div className="my-4">
        <Button className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-4 rounded mr-2">Primary Button</Button>
        <Button className="bg-secondary hover:bg-secondary/80 text-white font-bold py-2 px-4 rounded">Secondary Button</Button>
        <Button className="bg-accent hover:bg-accent/80 text-white font-bold py-2 px-4 rounded">Accent Button</Button>
      </div>

      <div className="my-4">
        <Input type="text" className="border border-gray-400 rounded py-2 px-4" placeholder="Text Field" />
      </div>

      <div className="my-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accept terms and conditions
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accept terms and conditions
          </Label>
        </div>
      </div>

      <div className="my-4">
        <RadioGroup defaultValue="comfortable">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default" id="r1" />
            <Label htmlFor="r1">Default</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="comfortable" id="r2" />
            <Label htmlFor="r2">Comfortable</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="compact" id="r3" />
            <Label htmlFor="r3">Compact</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="my-4">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem value="grapes">Grapes</SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default KitchenSinkPage;
